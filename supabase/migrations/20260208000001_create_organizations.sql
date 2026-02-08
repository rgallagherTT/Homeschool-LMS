-- ============================================================================
-- Migration: Create Organizations Table (Multi-Tenant Foundation)
-- Description: Core organizations table for multi-tenant isolation
-- ============================================================================

-- Organizations table (multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  industry TEXT,
  size TEXT CHECK (size IN ('1-10', '11-50', '51-200', '201-500', '501+')),
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  subscription_plan TEXT DEFAULT 'free',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index on subdomain for quick lookups
CREATE INDEX idx_organizations_subdomain ON organizations (subdomain);

-- Index on active status for filtering
CREATE INDEX idx_organizations_is_active ON organizations (is_active);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE organizations IS 'Multi-tenant organizations table. All data is scoped to an organization.';
COMMENT ON COLUMN organizations.subdomain IS 'Unique subdomain identifier for the organization (e.g., acme -> acme.app.com)';
COMMENT ON COLUMN organizations.subscription_plan IS 'Current subscription tier: free, starter, professional, enterprise';
