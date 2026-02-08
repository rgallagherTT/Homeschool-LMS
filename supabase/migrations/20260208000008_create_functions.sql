-- ============================================================================
-- Migration: Create Database Functions and Triggers
-- Description: Utility functions for auto-profile creation, updated_at
--              management, and ticket number generation
-- ============================================================================

-- -------------------------------------------------------
-- 1. update_updated_at() - Auto-update updated_at on row change
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at() IS 'Trigger function: sets updated_at = now() on every UPDATE';

-- -------------------------------------------------------
-- Apply updated_at triggers to all tables with updated_at
-- -------------------------------------------------------
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------
-- 2. generate_ticket_number() - Auto-assign TKT-XXXXX
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number = 'TKT-' || LPAD(nextval('ticket_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION generate_ticket_number() IS 'Trigger function: auto-generates ticket_number as TKT-XXXXX using ticket_number_seq';

CREATE TRIGGER trg_tickets_generate_number
  BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- -------------------------------------------------------
-- 3. handle_new_user() - Auto-create profile on auth signup
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id UUID;
  _default_role_id UUID;
BEGIN
  -- Get the organization_id from user metadata (passed during signup)
  _org_id := (NEW.raw_user_meta_data ->> 'organization_id')::UUID;

  -- If no org provided, try to find or create a default one
  IF _org_id IS NULL THEN
    SELECT id INTO _org_id
    FROM organizations
    WHERE subdomain = 'default'
    LIMIT 1;
  END IF;

  -- If we still don't have an org, we can't create a profile
  IF _org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the default role for this organization
  SELECT id INTO _default_role_id
  FROM roles
  WHERE organization_id = _org_id
    AND is_default = true
  LIMIT 1;

  -- Create the profile
  INSERT INTO profiles (
    id,
    organization_id,
    first_name,
    last_name,
    role_id,
    is_active
  ) VALUES (
    NEW.id,
    _org_id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    _default_role_id,
    true
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_user() IS 'Trigger function: auto-creates a profile row when a new auth.users record is inserted';

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -------------------------------------------------------
-- 4. Utility: convert_lead() - Convert a lead into contact + account + deal
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION convert_lead(
  p_lead_id UUID,
  p_create_account BOOLEAN DEFAULT true,
  p_create_deal BOOLEAN DEFAULT true,
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
  v_pipeline_id UUID;
BEGIN
  -- Fetch the lead
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;

  IF v_lead IS NULL THEN
    RAISE EXCEPTION 'Lead not found: %', p_lead_id;
  END IF;

  IF v_lead.converted THEN
    RAISE EXCEPTION 'Lead already converted: %', p_lead_id;
  END IF;

  -- Create account if requested
  IF p_create_account AND v_lead.company IS NOT NULL THEN
    INSERT INTO accounts (organization_id, name, owner_id)
    VALUES (v_lead.organization_id, v_lead.company, v_lead.assigned_to)
    RETURNING id INTO v_account_id;
  END IF;

  -- Create contact
  INSERT INTO contacts (
    organization_id, account_id, first_name, last_name,
    email, phone, title, owner_id
  ) VALUES (
    v_lead.organization_id, v_account_id, v_lead.first_name, v_lead.last_name,
    v_lead.email, v_lead.phone, v_lead.title, v_lead.assigned_to
  ) RETURNING id INTO v_contact_id;

  -- Create deal if requested
  IF p_create_deal THEN
    v_pipeline_id := p_pipeline_id;
    IF v_pipeline_id IS NULL THEN
      SELECT id INTO v_pipeline_id
      FROM pipelines
      WHERE organization_id = v_lead.organization_id AND is_default = true
      LIMIT 1;
    END IF;

    IF v_pipeline_id IS NOT NULL THEN
      INSERT INTO deals (
        organization_id, pipeline_id, stage_id, name,
        account_id, contact_id, owner_id, status
      ) VALUES (
        v_lead.organization_id, v_pipeline_id, 'prospecting',
        COALESCE(p_deal_name, v_lead.company || ' - Deal'),
        v_account_id, v_contact_id, v_lead.assigned_to, 'open'
      ) RETURNING id INTO v_deal_id;
    END IF;
  END IF;

  -- Mark lead as converted
  UPDATE leads
  SET converted = true,
      converted_at = now(),
      converted_contact_id = v_contact_id,
      converted_account_id = v_account_id,
      converted_deal_id = v_deal_id,
      status = 'qualified'
  WHERE id = p_lead_id;

  RETURN jsonb_build_object(
    'contact_id', v_contact_id,
    'account_id', v_account_id,
    'deal_id', v_deal_id
  );
END;
$$;

COMMENT ON FUNCTION convert_lead(UUID, BOOLEAN, BOOLEAN, TEXT, UUID) IS 'Converts a lead into a contact, optionally an account and deal. Returns JSON with new record IDs.';
