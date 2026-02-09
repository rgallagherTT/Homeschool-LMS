-- Migration: Create functions and triggers
-- Description: Auto-updated timestamps, ticket number generation, new user handling, lead conversion

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at() IS 'Trigger function that automatically sets updated_at to current timestamp on row update.';

-- Apply updated_at trigger to all tables that have an updated_at column
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'organizations',
        'roles',
        'profiles',
        'leads',
        'accounts',
        'contacts',
        'pipelines',
        'deals',
        'activities',
        'tickets',
        'campaigns',
        'email_campaigns'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trigger_update_%I_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION public.update_updated_at()',
            tbl, tbl
        );
    END LOOP;
END;
$$;

-- ============================================================
-- GENERATE TICKET NUMBER TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := 'TKT-' || LPAD(nextval('public.ticket_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.generate_ticket_number() IS 'Trigger function that auto-generates a human-readable ticket number (TKT-00001) if not provided.';

CREATE TRIGGER trigger_generate_ticket_number
    BEFORE INSERT ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_ticket_number();

-- ============================================================
-- HANDLE NEW USER TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_organization_id UUID;
    v_first_name TEXT;
    v_last_name TEXT;
    v_default_role_id UUID;
BEGIN
    -- Extract metadata from the new user
    v_organization_id := (NEW.raw_user_meta_data ->> 'organization_id')::UUID;
    v_first_name := COALESCE(NEW.raw_user_meta_data ->> 'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data ->> 'last_name', '');

    -- If no organization_id in metadata, skip profile creation
    IF v_organization_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Find the default role for this organization
    SELECT id INTO v_default_role_id
    FROM public.roles
    WHERE organization_id = v_organization_id
      AND is_default = true
    LIMIT 1;

    -- Create the user profile
    INSERT INTO public.profiles (
        id,
        organization_id,
        first_name,
        last_name,
        role_id,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        v_organization_id,
        v_first_name,
        v_last_name,
        v_default_role_id,
        true,
        now(),
        now()
    );

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that auto-creates a profile when a new auth.users row is inserted. Reads organization_id, first_name, last_name from user metadata.';

-- Create the trigger on auth.users
CREATE TRIGGER trigger_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CONVERT LEAD FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.convert_lead(
    p_lead_id UUID,
    p_create_account BOOLEAN DEFAULT true,
    p_create_deal BOOLEAN DEFAULT false,
    p_deal_name TEXT DEFAULT NULL,
    p_pipeline_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lead RECORD;
    v_contact_id UUID;
    v_account_id UUID;
    v_deal_id UUID;
    v_default_pipeline_id UUID;
    v_first_stage_id TEXT;
    v_result JSONB;
BEGIN
    -- Fetch the lead
    SELECT * INTO v_lead
    FROM public.leads
    WHERE id = p_lead_id;

    -- Validate the lead exists and is not already converted
    IF v_lead IS NULL THEN
        RAISE EXCEPTION 'Lead not found: %', p_lead_id;
    END IF;

    IF v_lead.converted = true THEN
        RAISE EXCEPTION 'Lead has already been converted: %', p_lead_id;
    END IF;

    -- Create Account (if requested)
    IF p_create_account AND v_lead.company IS NOT NULL THEN
        INSERT INTO public.accounts (
            organization_id,
            name,
            owner_id,
            created_at,
            updated_at
        ) VALUES (
            v_lead.organization_id,
            v_lead.company,
            v_lead.assigned_to,
            now(),
            now()
        )
        RETURNING id INTO v_account_id;
    END IF;

    -- Create Contact
    INSERT INTO public.contacts (
        organization_id,
        account_id,
        first_name,
        last_name,
        email,
        phone,
        title,
        owner_id,
        created_at,
        updated_at
    ) VALUES (
        v_lead.organization_id,
        v_account_id,
        v_lead.first_name,
        v_lead.last_name,
        v_lead.email,
        v_lead.phone,
        v_lead.title,
        v_lead.assigned_to,
        now(),
        now()
    )
    RETURNING id INTO v_contact_id;

    -- Create Deal (if requested)
    IF p_create_deal THEN
        -- Resolve pipeline
        IF p_pipeline_id IS NOT NULL THEN
            v_default_pipeline_id := p_pipeline_id;
        ELSE
            SELECT id INTO v_default_pipeline_id
            FROM public.pipelines
            WHERE organization_id = v_lead.organization_id
              AND is_default = true
            LIMIT 1;
        END IF;

        -- Get first stage from pipeline
        IF v_default_pipeline_id IS NOT NULL THEN
            SELECT stages->0->>'id' INTO v_first_stage_id
            FROM public.pipelines
            WHERE id = v_default_pipeline_id;
        END IF;

        INSERT INTO public.deals (
            organization_id,
            pipeline_id,
            stage_id,
            name,
            account_id,
            contact_id,
            status,
            owner_id,
            created_at,
            updated_at
        ) VALUES (
            v_lead.organization_id,
            v_default_pipeline_id,
            v_first_stage_id,
            COALESCE(p_deal_name, v_lead.company || ' - Deal'),
            v_account_id,
            v_contact_id,
            'open',
            v_lead.assigned_to,
            now(),
            now()
        )
        RETURNING id INTO v_deal_id;
    END IF;

    -- Mark lead as converted
    UPDATE public.leads
    SET converted = true,
        converted_at = now(),
        converted_contact_id = v_contact_id,
        converted_account_id = v_account_id,
        converted_deal_id = v_deal_id,
        status = 'converted',
        updated_at = now()
    WHERE id = p_lead_id;

    -- Build result
    v_result := jsonb_build_object(
        'success', true,
        'lead_id', p_lead_id,
        'contact_id', v_contact_id,
        'account_id', v_account_id,
        'deal_id', v_deal_id
    );

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.convert_lead(UUID, BOOLEAN, BOOLEAN, TEXT, UUID) IS 'Converts a lead into a contact (always), account (optional), and deal (optional). Marks the lead as converted and links the new records.';
