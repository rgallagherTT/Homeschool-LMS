-- ============================================================================
-- Migration: Create Profiles and Roles Tables
-- Description: User profiles extending Supabase auth.users, and role-based
--              access control with JSONB permissions
-- ============================================================================

-- -------------------------------------------------------
-- Roles table
-- -------------------------------------------------------
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  permissions JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE INDEX idx_roles_organization_id ON roles (organization_id);
CREATE INDEX idx_roles_is_default ON roles (organization_id, is_default);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE roles IS 'Organization-scoped roles with JSONB permission sets';
COMMENT ON COLUMN roles.permissions IS 'JSONB permission map, e.g. {"leads": {"read": true, "write": true}, "deals": {"read": true}}';

-- -------------------------------------------------------
-- Profiles table (extends Supabase auth.users)
-- -------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  profile_picture_url TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_organization_id ON profiles (organization_id);
CREATE INDEX idx_profiles_role_id ON profiles (role_id);
CREATE INDEX idx_profiles_is_active ON profiles (organization_id, is_active);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE profiles IS 'Extended user profiles linked 1:1 with Supabase auth.users';
COMMENT ON COLUMN profiles.id IS 'References auth.users(id) — the Supabase managed user';

-- -------------------------------------------------------
-- RLS Policies for roles
-- -------------------------------------------------------
CREATE POLICY "roles_select_own_org"
  ON roles FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "roles_insert_own_org"
  ON roles FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "roles_update_own_org"
  ON roles FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "roles_delete_own_org"
  ON roles FOR DELETE
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- -------------------------------------------------------
-- RLS Policies for profiles
-- -------------------------------------------------------
CREATE POLICY "profiles_select_own_org"
  ON profiles FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());
