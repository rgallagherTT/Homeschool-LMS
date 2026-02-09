-- Migration: Create organizations table
-- Description: Core tenant table for multi-tenant SaaS architecture

CREATE TABLE IF NOT EXISTS public.organizations (
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

-- Add comment for documentation
COMMENT ON TABLE public.organizations IS 'Multi-tenant organizations table. Each organization represents a separate tenant.';
COMMENT ON COLUMN public.organizations.subdomain IS 'Unique subdomain identifier for the organization (e.g., acme.crmapp.com)';
COMMENT ON COLUMN public.organizations.subscription_plan IS 'Current subscription tier: free, starter, professional, enterprise';

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
