-- ============================================================================
-- Migration: Create Comprehensive RLS Policies for All Tables
-- Description: Organization-level isolation for every table, plus role-based
--              access control (admin full CRUD, sales reps own-records only)
-- ============================================================================

-- -------------------------------------------------------
-- Helper: Immutable function to get the current user's org
-- (used in policies to avoid repeated subqueries)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- -------------------------------------------------------
-- Helper: Check if current user has a given role name
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.user_has_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    WHERE p.id = auth.uid()
      AND r.name = role_name
  );
$$;

-- ===============================================================
-- ORGANIZATIONS
-- ===============================================================
CREATE POLICY "org_isolation_organizations"
  ON organizations FOR SELECT
  USING (
    id = auth.user_organization_id()
  );

-- Only super-admins (service role) should create orgs; authenticated
-- admins can update their own org.
CREATE POLICY "org_update_own"
  ON organizations FOR UPDATE
  USING (
    id = auth.user_organization_id()
    AND auth.user_has_role('admin')
  );

-- ===============================================================
-- LEADS  (admins see all in org; sales reps see only assigned)
-- ===============================================================

-- Drop the broad policies if they exist from previous migration
-- (leads didn't have policies yet, but being defensive)
DROP POLICY IF EXISTS "org_isolation_leads_select" ON leads;
DROP POLICY IF EXISTS "org_isolation_leads_insert" ON leads;
DROP POLICY IF EXISTS "org_isolation_leads_update" ON leads;
DROP POLICY IF EXISTS "org_isolation_leads_delete" ON leads;

-- SELECT: admins see all org leads, reps see assigned
CREATE POLICY "org_isolation_leads_select"
  ON leads FOR SELECT
  USING (
    organization_id = auth.user_organization_id()
    AND (
      auth.user_has_role('admin')
      OR assigned_to = auth.uid()
      OR created_by = auth.uid()
    )
  );

-- INSERT: any authenticated user in the org
CREATE POLICY "org_isolation_leads_insert"
  ON leads FOR INSERT
  WITH CHECK (
    organization_id = auth.user_organization_id()
  );

-- UPDATE: admins or the assigned rep
CREATE POLICY "org_isolation_leads_update"
  ON leads FOR UPDATE
  USING (
    organization_id = auth.user_organization_id()
    AND (
      auth.user_has_role('admin')
      OR assigned_to = auth.uid()
    )
  );

-- DELETE: admins only
CREATE POLICY "org_isolation_leads_delete"
  ON leads FOR DELETE
  USING (
    organization_id = auth.user_organization_id()
    AND auth.user_has_role('admin')
  );

-- ===============================================================
-- ACCOUNTS  (admins see all; reps see own)
-- ===============================================================
CREATE POLICY "org_isolation_accounts_select"
  ON accounts FOR SELECT
  USING (
    organization_id = auth.user_organization_id()
    AND (
      auth.user_has_role('admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "org_isolation_accounts_insert"
  ON accounts FOR INSERT
  WITH CHECK (
    organization_id = auth.user_organization_id()
  );

CREATE POLICY "org_isolation_accounts_update"
  ON accounts FOR UPDATE
  USING (
    organization_id = auth.user_organization_id()
    AND (
      auth.user_has_role('admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "org_isolation_accounts_delete"
  ON accounts FOR DELETE
  USING (
    organization_id = auth.user_organization_id()
    AND auth.user_has_role('admin')
  );

-- ===============================================================
-- CONTACTS  (admins see all; reps see own)
-- ===============================================================
CREATE POLICY "org_isolation_contacts_select"
  ON contacts FOR SELECT
  USING (
    organization_id = auth.user_organization_id()
    AND (
      auth.user_has_role('admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "org_isolation_contacts_insert"
  ON contacts FOR INSERT
  WITH CHECK (
    organization_id = auth.user_organization_id()
  );

CREATE POLICY "org_isolation_contacts_update"
  ON contacts FOR UPDATE
  USING (
    organization_id = auth.user_organization_id()
    AND (
      auth.user_has_role('admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "org_isolation_contacts_delete"
  ON contacts FOR DELETE
  USING (
    organization_id = auth.user_organization_id()
    AND auth.user_has_role('admin')
  );

-- ===============================================================
-- DEALS  (admins see all; reps see own)
-- ===============================================================
CREATE POLICY "org_isolation_deals_select"
  ON deals FOR SELECT
  USING (
    organization_id = auth.user_organization_id()
    AND (
      auth.user_has_role('admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "org_isolation_deals_insert"
  ON deals FOR INSERT
  WITH CHECK (
    organization_id = auth.user_organization_id()
  );

CREATE POLICY "org_isolation_deals_update"
  ON deals FOR UPDATE
  USING (
    organization_id = auth.user_organization_id()
    AND (
      auth.user_has_role('admin')
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "org_isolation_deals_delete"
  ON deals FOR DELETE
  USING (
    organization_id = auth.user_organization_id()
    AND auth.user_has_role('admin')
  );

-- ===============================================================
-- PIPELINES  (all org members can read; admins can manage)
-- ===============================================================
CREATE POLICY "org_isolation_pipelines_select"
  ON pipelines FOR SELECT
  USING (
    organization_id = auth.user_organization_id()
  );

CREATE POLICY "org_isolation_pipelines_insert"
  ON pipelines FOR INSERT
  WITH CHECK (
    organization_id = auth.user_organization_id()
    AND auth.user_has_role('admin')
  );

CREATE POLICY "org_isolation_pipelines_update"
  ON pipelines FOR UPDATE
  USING (
    organization_id = auth.user_organization_id()
    AND auth.user_has_role('admin')
  );

CREATE POLICY "org_isolation_pipelines_delete"
  ON pipelines FOR DELETE
  USING (
    organization_id = auth.user_organization_id()
    AND auth.user_has_role('admin')
  );
