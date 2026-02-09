-- Migration: Create profiles and roles tables
-- Description: User profiles linked to auth.users and role-based access control

-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.roles IS 'Role definitions with JSONB permissions for each organization.';
COMMENT ON COLUMN public.roles.permissions IS 'JSON object defining granular permissions, e.g. {"leads": {"read": true, "write": true, "delete": false}}';
COMMENT ON COLUMN public.roles.is_default IS 'If true, new users joining this organization are assigned this role automatically.';

-- Ensure only one default role per organization
CREATE UNIQUE INDEX idx_roles_default_per_org
    ON public.roles (organization_id)
    WHERE is_default = true;

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    profile_picture_url TEXT,
    phone TEXT,
    timezone TEXT,
    language TEXT DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Extended user profiles linked 1:1 with auth.users. Contains org membership and role assignment.';

-- Indexes
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX idx_profiles_role_id ON public.profiles(role_id);

-- Enable Row Level Security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
