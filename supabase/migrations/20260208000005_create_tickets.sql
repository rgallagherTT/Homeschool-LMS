-- ============================================================================
-- Migration: Create Tickets and Ticket Comments Tables
-- Description: Help desk / support ticket system with auto-generated ticket
--              numbers, SLA tracking, satisfaction ratings, and internal notes
-- ============================================================================

-- -------------------------------------------------------
-- Sequence for auto-generating ticket numbers
-- -------------------------------------------------------
CREATE SEQUENCE ticket_number_seq START WITH 1 INCREMENT BY 1;

-- -------------------------------------------------------
-- Tickets
-- -------------------------------------------------------
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'waiting_on_customer', 'waiting_on_third_party', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  team_id UUID,
  channel TEXT DEFAULT 'web'
    CHECK (channel IN ('web', 'email', 'phone', 'chat', 'social', 'api')),
  sla_due_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  satisfaction_rating INTEGER
    CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tickets_organization_id ON tickets (organization_id);
CREATE INDEX idx_tickets_ticket_number ON tickets (ticket_number);
CREATE INDEX idx_tickets_status ON tickets (organization_id, status);
CREATE INDEX idx_tickets_priority ON tickets (organization_id, priority);
CREATE INDEX idx_tickets_assigned_to ON tickets (assigned_to);
CREATE INDEX idx_tickets_contact_id ON tickets (contact_id);
CREATE INDEX idx_tickets_account_id ON tickets (account_id);
CREATE INDEX idx_tickets_sla_due ON tickets (organization_id, sla_due_at)
  WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX idx_tickets_tags ON tickets USING GIN (tags);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE tickets IS 'Support / help desk tickets with SLA tracking';
COMMENT ON COLUMN tickets.ticket_number IS 'Human-readable ticket number, auto-generated as TKT-XXXXX';
COMMENT ON COLUMN tickets.channel IS 'Channel through which the ticket was created';

-- -------------------------------------------------------
-- Ticket Comments
-- -------------------------------------------------------
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments (ticket_id);
CREATE INDEX idx_ticket_comments_user_id ON ticket_comments (user_id);
CREATE INDEX idx_ticket_comments_is_internal ON ticket_comments (ticket_id, is_internal);

ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE ticket_comments IS 'Comments / replies on tickets; is_internal marks agent-only notes';

-- -------------------------------------------------------
-- RLS Policies for tickets
-- -------------------------------------------------------
CREATE POLICY "tickets_select_own_org"
  ON tickets FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "tickets_insert_own_org"
  ON tickets FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "tickets_update_own_org"
  ON tickets FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "tickets_delete_own_org"
  ON tickets FOR DELETE
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- -------------------------------------------------------
-- RLS Policies for ticket_comments
-- -------------------------------------------------------
CREATE POLICY "ticket_comments_select_own_org"
  ON ticket_comments FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "ticket_comments_insert_own_org"
  ON ticket_comments FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "ticket_comments_update_own"
  ON ticket_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "ticket_comments_delete_own"
  ON ticket_comments FOR DELETE
  USING (user_id = auth.uid());
