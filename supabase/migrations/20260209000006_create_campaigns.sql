-- Migration: Create campaigns, email_campaigns, and email_recipients tables
-- Description: Marketing campaign management with email tracking

-- ============================================================
-- CAMPAIGNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('email', 'social', 'event', 'other')),
    status TEXT CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')) DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15, 2),
    expected_revenue DECIMAL(15, 2),
    actual_revenue DECIMAL(15, 2) DEFAULT 0,
    description TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.campaigns IS 'Marketing campaigns across multiple channels with budget and revenue tracking.';

-- ============================================================
-- EMAIL CAMPAIGNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    subject TEXT,
    from_name TEXT,
    from_email TEXT,
    reply_to TEXT,
    html_body TEXT,
    text_body TEXT,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    recipient_count INT DEFAULT 0,
    opened_count INT DEFAULT 0,
    clicked_count INT DEFAULT 0,
    bounced_count INT DEFAULT 0,
    unsubscribed_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.email_campaigns IS 'Email-specific campaign details including content, scheduling, and aggregate stats.';

-- ============================================================
-- EMAIL RECIPIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    opened BOOLEAN DEFAULT false,
    opened_at TIMESTAMPTZ,
    clicked BOOLEAN DEFAULT false,
    clicked_at TIMESTAMPTZ,
    bounced BOOLEAN DEFAULT false,
    unsubscribed BOOLEAN DEFAULT false
);

COMMENT ON TABLE public.email_recipients IS 'Per-recipient tracking for email campaigns: delivery, opens, clicks, bounces.';

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_campaigns_org ON public.campaigns(organization_id);
CREATE INDEX idx_campaigns_org_status ON public.campaigns(organization_id, status);
CREATE INDEX idx_campaigns_owner ON public.campaigns(owner_id);

CREATE INDEX idx_email_campaigns_campaign ON public.email_campaigns(campaign_id);

CREATE INDEX idx_email_recipients_campaign ON public.email_recipients(email_campaign_id);
CREATE INDEX idx_email_recipients_contact ON public.email_recipients(contact_id);

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;
