-- Migration: Create RLS policies for all tables
-- Description: Organization-level isolation with role-based access control

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get the organization_id for the currently authenticated user
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id
    FROM public.profiles
    WHERE id = auth.uid()
$$;

COMMENT ON FUNCTION auth.user_organization_id() IS 'Returns the organization_id of the currently authenticated user from their profile.';

-- Check if the authenticated user has a specific role by name
CREATE OR REPLACE FUNCTION auth.user_has_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.id = auth.uid()
          AND r.name = role_name
    )
$$;

COMMENT ON FUNCTION auth.user_has_role(TEXT) IS 'Returns true if the authenticated user has the given role name in their organization.';

-- ============================================================
-- ORGANIZATIONS POLICIES
-- ============================================================

-- Users can view their own organization
CREATE POLICY "Users can view their own organization"
    ON public.organizations
    FOR SELECT
    USING (id = auth.user_organization_id());

-- Admins can update their own organization
CREATE POLICY "Admins can update their own organization"
    ON public.organizations
    FOR UPDATE
    USING (
        id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    )
    WITH CHECK (
        id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Users can view all profiles in their organization
CREATE POLICY "Users can view profiles in their organization"
    ON public.profiles
    FOR SELECT
    USING (organization_id = auth.user_organization_id());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admins can insert profiles in their organization
CREATE POLICY "Admins can insert profiles in their organization"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

-- Admins can delete profiles in their organization
CREATE POLICY "Admins can delete profiles in their organization"
    ON public.profiles
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

-- ============================================================
-- ROLES POLICIES
-- ============================================================

-- Users can view roles in their organization
CREATE POLICY "Users can view roles in their organization"
    ON public.roles
    FOR SELECT
    USING (organization_id = auth.user_organization_id());

-- Admins can manage roles in their organization
CREATE POLICY "Admins can insert roles"
    ON public.roles
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

CREATE POLICY "Admins can update roles"
    ON public.roles
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    )
    WITH CHECK (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

CREATE POLICY "Admins can delete roles"
    ON public.roles
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

-- ============================================================
-- LEADS POLICIES
-- ============================================================

-- Admins and sales managers can see all leads in their org
CREATE POLICY "Admins and managers can view all leads"
    ON public.leads
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('sales_manager')
        )
    );

-- Sales reps can see leads assigned to them or created by them
CREATE POLICY "Sales reps can view assigned leads"
    ON public.leads
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND (
            assigned_to = auth.uid()
            OR created_by = auth.uid()
        )
    );

-- Admins and managers can insert leads
CREATE POLICY "Admins and managers can insert leads"
    ON public.leads
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('sales_manager')
            OR auth.user_has_role('sales_rep')
        )
    );

-- Admins can update any lead in their org; reps can update their assigned leads
CREATE POLICY "Admins can update all leads"
    ON public.leads
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('sales_manager')
        )
    )
    WITH CHECK (
        organization_id = auth.user_organization_id()
    );

CREATE POLICY "Sales reps can update assigned leads"
    ON public.leads
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND assigned_to = auth.uid()
    )
    WITH CHECK (
        organization_id = auth.user_organization_id()
    );

-- Admins can delete leads
CREATE POLICY "Admins can delete leads"
    ON public.leads
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

-- ============================================================
-- ACCOUNTS POLICIES
-- ============================================================

-- Admins and managers see all accounts
CREATE POLICY "Admins and managers can view all accounts"
    ON public.accounts
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('sales_manager')
        )
    );

-- Sales reps see owned accounts
CREATE POLICY "Sales reps can view owned accounts"
    ON public.accounts
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND owner_id = auth.uid()
    );

-- Insert accounts
CREATE POLICY "Org members can insert accounts"
    ON public.accounts
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id()
    );

-- Admins/managers update any account; reps update owned
CREATE POLICY "Admins can update all accounts"
    ON public.accounts
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('sales_manager')
        )
    )
    WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Sales reps can update owned accounts"
    ON public.accounts
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND owner_id = auth.uid()
    )
    WITH CHECK (organization_id = auth.user_organization_id());

-- Admins can delete accounts
CREATE POLICY "Admins can delete accounts"
    ON public.accounts
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

-- ============================================================
-- CONTACTS POLICIES
-- ============================================================

-- Admins and managers see all contacts
CREATE POLICY "Admins and managers can view all contacts"
    ON public.contacts
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('sales_manager')
        )
    );

-- Sales reps see owned contacts
CREATE POLICY "Sales reps can view owned contacts"
    ON public.contacts
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND owner_id = auth.uid()
    );

-- Support agents can view contacts (for ticket context)
CREATE POLICY "Support agents can view contacts"
    ON public.contacts
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('support_agent')
    );

-- Insert contacts
CREATE POLICY "Org members can insert contacts"
    ON public.contacts
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id()
    );

-- Admins/managers update any contact; reps update owned
CREATE POLICY "Admins can update all contacts"
    ON public.contacts
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('sales_manager')
        )
    )
    WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Sales reps can update owned contacts"
    ON public.contacts
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND owner_id = auth.uid()
    )
    WITH CHECK (organization_id = auth.user_organization_id());

-- Admins can delete contacts
CREATE POLICY "Admins can delete contacts"
    ON public.contacts
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

-- ============================================================
-- PIPELINES POLICIES
-- ============================================================

-- All org members can view pipelines
CREATE POLICY "Org members can view pipelines"
    ON public.pipelines
    FOR SELECT
    USING (organization_id = auth.user_organization_id());

-- Admins can manage pipelines
CREATE POLICY "Admins can insert pipelines"
    ON public.pipelines
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

CREATE POLICY "Admins can update pipelines"
    ON public.pipelines
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    )
    WITH CHECK (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

CREATE POLICY "Admins can delete pipelines"
    ON public.pipelines
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

-- ============================================================
-- DEALS POLICIES
-- ============================================================

-- Admins and managers see all deals
CREATE POLICY "Admins and managers can view all deals"
    ON public.deals
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('sales_manager')
        )
    );

-- Sales reps see owned deals
CREATE POLICY "Sales reps can view owned deals"
    ON public.deals
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND owner_id = auth.uid()
    );

-- Insert deals
CREATE POLICY "Org members can insert deals"
    ON public.deals
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id()
    );

-- Admins/managers update any deal; reps update owned
CREATE POLICY "Admins can update all deals"
    ON public.deals
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('sales_manager')
        )
    )
    WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Sales reps can update owned deals"
    ON public.deals
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND owner_id = auth.uid()
    )
    WITH CHECK (organization_id = auth.user_organization_id());

-- Admins can delete deals
CREATE POLICY "Admins can delete deals"
    ON public.deals
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

-- ============================================================
-- ACTIVITIES POLICIES
-- ============================================================

-- Admins and managers see all activities
CREATE POLICY "Admins and managers can view all activities"
    ON public.activities
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('sales_manager')
        )
    );

-- Users can see activities assigned to them or created by them
CREATE POLICY "Users can view their own activities"
    ON public.activities
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND (
            assigned_to = auth.uid()
            OR created_by = auth.uid()
        )
    );

-- Org members can create activities
CREATE POLICY "Org members can insert activities"
    ON public.activities
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id()
    );

-- Admins update any activity; users update their own
CREATE POLICY "Admins can update all activities"
    ON public.activities
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    )
    WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update their own activities"
    ON public.activities
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND (
            assigned_to = auth.uid()
            OR created_by = auth.uid()
        )
    )
    WITH CHECK (organization_id = auth.user_organization_id());

-- Admins can delete activities
CREATE POLICY "Admins can delete activities"
    ON public.activities
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

-- ============================================================
-- TICKETS POLICIES
-- ============================================================

-- Admins and support agents see all tickets in their org
CREATE POLICY "Admins and support see all tickets"
    ON public.tickets
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('support_agent')
            OR auth.user_has_role('sales_manager')
        )
    );

-- Users can see tickets assigned to them
CREATE POLICY "Users can view assigned tickets"
    ON public.tickets
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND assigned_to = auth.uid()
    );

-- Org members can create tickets
CREATE POLICY "Org members can insert tickets"
    ON public.tickets
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id()
    );

-- Admins and support can update tickets
CREATE POLICY "Admins and support can update tickets"
    ON public.tickets
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('support_agent')
            OR assigned_to = auth.uid()
        )
    )
    WITH CHECK (organization_id = auth.user_organization_id());

-- Admins can delete tickets
CREATE POLICY "Admins can delete tickets"
    ON public.tickets
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

-- ============================================================
-- TICKET COMMENTS POLICIES
-- ============================================================

-- Users can view comments on tickets they can access (same org)
CREATE POLICY "Org members can view ticket comments"
    ON public.ticket_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_comments.ticket_id
              AND t.organization_id = auth.user_organization_id()
        )
    );

-- Org members can add comments
CREATE POLICY "Org members can insert ticket comments"
    ON public.ticket_comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_comments.ticket_id
              AND t.organization_id = auth.user_organization_id()
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own ticket comments"
    ON public.ticket_comments
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can delete comments
CREATE POLICY "Admins can delete ticket comments"
    ON public.ticket_comments
    FOR DELETE
    USING (
        auth.user_has_role('admin')
        AND EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_comments.ticket_id
              AND t.organization_id = auth.user_organization_id()
        )
    );

-- ============================================================
-- CAMPAIGNS POLICIES
-- ============================================================

-- Admins and managers see all campaigns
CREATE POLICY "Admins and managers can view all campaigns"
    ON public.campaigns
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('sales_manager')
        )
    );

-- Campaign owners can view their campaigns
CREATE POLICY "Owners can view their campaigns"
    ON public.campaigns
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id()
        AND owner_id = auth.uid()
    );

-- Org members can create campaigns
CREATE POLICY "Org members can insert campaigns"
    ON public.campaigns
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id()
    );

-- Admins/managers update any campaign; owners update their own
CREATE POLICY "Admins can update all campaigns"
    ON public.campaigns
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND (
            auth.user_has_role('admin')
            OR auth.user_has_role('sales_manager')
        )
    )
    WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Owners can update their campaigns"
    ON public.campaigns
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id()
        AND owner_id = auth.uid()
    )
    WITH CHECK (organization_id = auth.user_organization_id());

-- Admins can delete campaigns
CREATE POLICY "Admins can delete campaigns"
    ON public.campaigns
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id()
        AND auth.user_has_role('admin')
    );

-- ============================================================
-- EMAIL CAMPAIGNS POLICIES
-- ============================================================

-- Users who can see the parent campaign can see email campaigns
CREATE POLICY "Org members can view email campaigns"
    ON public.email_campaigns
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = email_campaigns.campaign_id
              AND c.organization_id = auth.user_organization_id()
        )
    );

CREATE POLICY "Org members can insert email campaigns"
    ON public.email_campaigns
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = email_campaigns.campaign_id
              AND c.organization_id = auth.user_organization_id()
        )
    );

CREATE POLICY "Admins can update email campaigns"
    ON public.email_campaigns
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = email_campaigns.campaign_id
              AND c.organization_id = auth.user_organization_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = email_campaigns.campaign_id
              AND c.organization_id = auth.user_organization_id()
        )
    );

CREATE POLICY "Admins can delete email campaigns"
    ON public.email_campaigns
    FOR DELETE
    USING (
        auth.user_has_role('admin')
        AND EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = email_campaigns.campaign_id
              AND c.organization_id = auth.user_organization_id()
        )
    );

-- ============================================================
-- EMAIL RECIPIENTS POLICIES
-- ============================================================

-- Users who can see the parent email campaign can see recipients
CREATE POLICY "Org members can view email recipients"
    ON public.email_recipients
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.email_campaigns ec
            JOIN public.campaigns c ON c.id = ec.campaign_id
            WHERE ec.id = email_recipients.email_campaign_id
              AND c.organization_id = auth.user_organization_id()
        )
    );

CREATE POLICY "Org members can insert email recipients"
    ON public.email_recipients
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.email_campaigns ec
            JOIN public.campaigns c ON c.id = ec.campaign_id
            WHERE ec.id = email_recipients.email_campaign_id
              AND c.organization_id = auth.user_organization_id()
        )
    );

CREATE POLICY "Admins can update email recipients"
    ON public.email_recipients
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.email_campaigns ec
            JOIN public.campaigns c ON c.id = ec.campaign_id
            WHERE ec.id = email_recipients.email_campaign_id
              AND c.organization_id = auth.user_organization_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.email_campaigns ec
            JOIN public.campaigns c ON c.id = ec.campaign_id
            WHERE ec.id = email_recipients.email_campaign_id
              AND c.organization_id = auth.user_organization_id()
        )
    );

CREATE POLICY "Admins can delete email recipients"
    ON public.email_recipients
    FOR DELETE
    USING (
        auth.user_has_role('admin')
        AND EXISTS (
            SELECT 1 FROM public.email_campaigns ec
            JOIN public.campaigns c ON c.id = ec.campaign_id
            WHERE ec.id = email_recipients.email_campaign_id
              AND c.organization_id = auth.user_organization_id()
        )
    );
