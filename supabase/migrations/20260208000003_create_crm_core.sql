-- ============================================================================
-- Migration: Create CRM Core Tables
-- Description: Leads, Accounts, Contacts, Deals, and Pipelines — the heart
--              of the CRM module
-- ============================================================================

-- -------------------------------------------------------
-- Pipelines
-- -------------------------------------------------------
CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  stages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE INDEX idx_pipelines_organization_id ON pipelines (organization_id);
CREATE INDEX idx_pipelines_is_default ON pipelines (organization_id, is_default);

ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE pipelines IS 'Sales pipelines with ordered stages stored as JSONB array';
COMMENT ON COLUMN pipelines.stages IS 'Array of stage objects: [{"id": "uuid", "name": "Stage Name", "probability": 20, "order": 1}]';

-- -------------------------------------------------------
-- Leads
-- -------------------------------------------------------
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified')),
  rating TEXT
    CHECK (rating IN ('hot', 'warm', 'cold')),
  score INTEGER DEFAULT 0
    CHECK (score >= 0 AND score <= 100),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  converted_contact_id UUID,
  converted_account_id UUID,
  converted_deal_id UUID,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_leads_organization_id ON leads (organization_id);
CREATE INDEX idx_leads_email ON leads (email, organization_id);
CREATE INDEX idx_leads_status ON leads (organization_id, status);
CREATE INDEX idx_leads_assigned_to ON leads (assigned_to);
CREATE INDEX idx_leads_converted ON leads (organization_id, converted);
CREATE INDEX idx_leads_rating ON leads (organization_id, rating);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE leads IS 'Sales leads — pre-qualification prospects that can be converted to contacts/accounts/deals';

-- -------------------------------------------------------
-- Accounts
-- -------------------------------------------------------
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  employee_count INTEGER,
  annual_revenue DECIMAL(15, 2),
  billing_address JSONB DEFAULT '{}',
  shipping_address JSONB DEFAULT '{}',
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_accounts_organization_id ON accounts (organization_id);
CREATE INDEX idx_accounts_name ON accounts (name, organization_id);
CREATE INDEX idx_accounts_owner_id ON accounts (owner_id);
CREATE INDEX idx_accounts_parent ON accounts (parent_account_id);
CREATE INDEX idx_accounts_industry ON accounts (organization_id, industry);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE accounts IS 'Business accounts / companies in the CRM';

-- -------------------------------------------------------
-- Contacts
-- -------------------------------------------------------
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  title TEXT,
  department TEXT,
  mailing_address JSONB DEFAULT '{}',
  social_profiles JSONB DEFAULT '{}',
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contacts_organization_id ON contacts (organization_id);
CREATE INDEX idx_contacts_email ON contacts (email, organization_id);
CREATE INDEX idx_contacts_account_id ON contacts (account_id);
CREATE INDEX idx_contacts_owner_id ON contacts (owner_id);
CREATE INDEX idx_contacts_name ON contacts (organization_id, last_name, first_name);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE contacts IS 'Individual contacts, optionally associated with an account';

-- -------------------------------------------------------
-- Deals
-- -------------------------------------------------------
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
  stage_id TEXT,
  name TEXT NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) DEFAULT 0,
  probability INTEGER DEFAULT 0
    CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'won', 'lost')),
  loss_reason TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deals_organization_id ON deals (organization_id);
CREATE INDEX idx_deals_status ON deals (organization_id, status);
CREATE INDEX idx_deals_pipeline_id ON deals (pipeline_id);
CREATE INDEX idx_deals_stage_id ON deals (organization_id, stage_id);
CREATE INDEX idx_deals_owner_id ON deals (owner_id);
CREATE INDEX idx_deals_account_id ON deals (account_id);
CREATE INDEX idx_deals_contact_id ON deals (contact_id);
CREATE INDEX idx_deals_expected_close ON deals (organization_id, expected_close_date);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE deals IS 'Sales deals / opportunities tracked through pipeline stages';

-- -------------------------------------------------------
-- Add deferred foreign keys from leads to converted records
-- -------------------------------------------------------
ALTER TABLE leads
  ADD CONSTRAINT fk_leads_converted_contact
    FOREIGN KEY (converted_contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE leads
  ADD CONSTRAINT fk_leads_converted_account
    FOREIGN KEY (converted_account_id) REFERENCES accounts(id) ON DELETE SET NULL;

ALTER TABLE leads
  ADD CONSTRAINT fk_leads_converted_deal
    FOREIGN KEY (converted_deal_id) REFERENCES deals(id) ON DELETE SET NULL;
