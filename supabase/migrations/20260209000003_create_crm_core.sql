-- Migration: Create CRM core tables
-- Description: Leads, Accounts, Contacts, Pipelines, and Deals

-- ============================================================
-- LEADS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    title TEXT,
    source TEXT,
    status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted')) DEFAULT 'new',
    rating TEXT CHECK (rating IN ('hot', 'warm', 'cold')),
    score INT DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    converted BOOLEAN DEFAULT false,
    converted_at TIMESTAMPTZ,
    converted_contact_id UUID,
    converted_account_id UUID,
    converted_deal_id UUID,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.leads IS 'Sales leads that can be qualified and converted into contacts, accounts, and deals.';
COMMENT ON COLUMN public.leads.score IS 'Lead score from 0 to 100 based on engagement and fit criteria.';
COMMENT ON COLUMN public.leads.custom_fields IS 'Arbitrary key-value pairs for organization-specific lead fields.';

-- ============================================================
-- ACCOUNTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    parent_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    employee_count INT,
    annual_revenue DECIMAL(15, 2),
    billing_address JSONB,
    shipping_address JSONB,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.accounts IS 'Business accounts / companies. Supports parent-child hierarchy via parent_account_id.';

-- ============================================================
-- CONTACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    title TEXT,
    department TEXT,
    mailing_address JSONB,
    social_profiles JSONB,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.contacts IS 'Individual contacts, optionally linked to an account.';

-- ============================================================
-- PIPELINES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    stages JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.pipelines IS 'Sales pipelines with configurable stages stored as JSONB.';
COMMENT ON COLUMN public.pipelines.stages IS 'Array of stage objects: [{"id": "uuid", "name": "Prospecting", "probability": 10, "order": 1}]';

-- Ensure only one default pipeline per organization
CREATE UNIQUE INDEX idx_pipelines_default_per_org
    ON public.pipelines (organization_id)
    WHERE is_default = true;

-- ============================================================
-- DEALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    stage_id TEXT,
    name TEXT NOT NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2),
    probability INT DEFAULT 0,
    expected_close_date DATE,
    actual_close_date DATE,
    status TEXT CHECK (status IN ('open', 'won', 'lost')) DEFAULT 'open',
    loss_reason TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.deals IS 'Sales deals / opportunities tracked through pipeline stages.';

-- ============================================================
-- Add foreign keys for lead conversion references (deferred because tables must exist first)
-- ============================================================
ALTER TABLE public.leads
    ADD CONSTRAINT fk_leads_converted_contact
    FOREIGN KEY (converted_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.leads
    ADD CONSTRAINT fk_leads_converted_account
    FOREIGN KEY (converted_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;

ALTER TABLE public.leads
    ADD CONSTRAINT fk_leads_converted_deal
    FOREIGN KEY (converted_deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_leads_org_email ON public.leads(organization_id, email);
CREATE INDEX idx_leads_org_status ON public.leads(organization_id, status);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);

CREATE INDEX idx_contacts_org_email ON public.contacts(organization_id, email);
CREATE INDEX idx_contacts_account_id ON public.contacts(account_id);

CREATE INDEX idx_accounts_org_name ON public.accounts(organization_id, name);
CREATE INDEX idx_accounts_owner_id ON public.accounts(owner_id);

CREATE INDEX idx_deals_org_status ON public.deals(organization_id, status);
CREATE INDEX idx_deals_pipeline_stage ON public.deals(pipeline_id, stage_id);
CREATE INDEX idx_deals_owner_id ON public.deals(owner_id);

CREATE INDEX idx_pipelines_org ON public.pipelines(organization_id);

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
