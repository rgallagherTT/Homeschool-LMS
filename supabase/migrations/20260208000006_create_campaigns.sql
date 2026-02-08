-- ============================================================================
-- Migration: Create Campaigns and Email Marketing Tables
-- Description: Marketing campaigns, email campaigns with tracking, and
--              per-recipient delivery/engagement metrics
-- ============================================================================

-- -------------------------------------------------------
-- Campaigns (parent marketing campaigns)
-- -------------------------------------------------------
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT
    CHECK (type IN ('email', 'social', 'webinar', 'event', 'advertisement', 'other')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15, 2) DEFAULT 0,
  expected_revenue DECIMAL(15, 2) DEFAULT 0,
  actual_revenue DECIMAL(15, 2) DEFAULT 0,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaigns_organization_id ON campaigns (organization_id);
CREATE INDEX idx_campaigns_status ON campaigns (organization_id, status);
CREATE INDEX idx_campaigns_owner_id ON campaigns (owner_id);
CREATE INDEX idx_campaigns_dates ON campaigns (organization_id, start_date, end_date);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE campaigns IS 'Marketing campaigns spanning various channels';

-- -------------------------------------------------------
-- Email Campaigns (child of campaigns)
-- -------------------------------------------------------
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to TEXT,
  html_body TEXT,
  text_body TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_campaigns_campaign_id ON email_campaigns (campaign_id);
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns (scheduled_at)
  WHERE sent_at IS NULL;

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE email_campaigns IS 'Individual email sends within a marketing campaign';

-- -------------------------------------------------------
-- Email Recipients (per-recipient tracking)
-- -------------------------------------------------------
CREATE TABLE email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMPTZ,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  bounced BOOLEAN DEFAULT false,
  unsubscribed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_recipients_campaign ON email_recipients (email_campaign_id);
CREATE INDEX idx_email_recipients_contact ON email_recipients (contact_id);
CREATE INDEX idx_email_recipients_email ON email_recipients (email);
CREATE INDEX idx_email_recipients_sent ON email_recipients (email_campaign_id, sent);

ALTER TABLE email_recipients ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE email_recipients IS 'Per-recipient delivery and engagement tracking for email campaigns';

-- -------------------------------------------------------
-- RLS Policies for campaigns
-- -------------------------------------------------------
CREATE POLICY "campaigns_select_own_org"
  ON campaigns FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "campaigns_insert_own_org"
  ON campaigns FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "campaigns_update_own_org"
  ON campaigns FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "campaigns_delete_own_org"
  ON campaigns FOR DELETE
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- -------------------------------------------------------
-- RLS Policies for email_campaigns (access via parent campaign)
-- -------------------------------------------------------
CREATE POLICY "email_campaigns_select_own_org"
  ON email_campaigns FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "email_campaigns_insert_own_org"
  ON email_campaigns FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "email_campaigns_update_own_org"
  ON email_campaigns FOR UPDATE
  USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "email_campaigns_delete_own_org"
  ON email_campaigns FOR DELETE
  USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
  );

-- -------------------------------------------------------
-- RLS Policies for email_recipients (access via parent email_campaign -> campaign)
-- -------------------------------------------------------
CREATE POLICY "email_recipients_select_own_org"
  ON email_recipients FOR SELECT
  USING (
    email_campaign_id IN (
      SELECT ec.id FROM email_campaigns ec
      JOIN campaigns c ON c.id = ec.campaign_id
      WHERE c.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "email_recipients_insert_own_org"
  ON email_recipients FOR INSERT
  WITH CHECK (
    email_campaign_id IN (
      SELECT ec.id FROM email_campaigns ec
      JOIN campaigns c ON c.id = ec.campaign_id
      WHERE c.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "email_recipients_update_own_org"
  ON email_recipients FOR UPDATE
  USING (
    email_campaign_id IN (
      SELECT ec.id FROM email_campaigns ec
      JOIN campaigns c ON c.id = ec.campaign_id
      WHERE c.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "email_recipients_delete_own_org"
  ON email_recipients FOR DELETE
  USING (
    email_campaign_id IN (
      SELECT ec.id FROM email_campaigns ec
      JOIN campaigns c ON c.id = ec.campaign_id
      WHERE c.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
  );
