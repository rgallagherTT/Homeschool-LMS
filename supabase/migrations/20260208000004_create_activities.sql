-- ============================================================================
-- Migration: Create Activities Table
-- Description: Unified activities table for tasks, events, calls, emails,
--              and notes linked to any CRM entity via polymorphic relation
-- ============================================================================

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('task', 'event', 'call', 'email', 'note')),
  subject TEXT NOT NULL,
  description TEXT,
  related_to_type TEXT
    CHECK (related_to_type IN ('lead', 'contact', 'account', 'deal', 'ticket')),
  related_to_id UUID,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Composite index for looking up activities by related entity
CREATE INDEX idx_activities_related
  ON activities (organization_id, related_to_type, related_to_id);

-- Index for assigned user's task list
CREATE INDEX idx_activities_assigned
  ON activities (assigned_to, completed);

-- Index for org-wide activity feed
CREATE INDEX idx_activities_organization_id
  ON activities (organization_id);

-- Index for due date queries (overdue tasks, upcoming events)
CREATE INDEX idx_activities_due_date
  ON activities (organization_id, due_date)
  WHERE completed = false;

-- Index by type
CREATE INDEX idx_activities_type
  ON activities (organization_id, type);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- RLS Policies
-- -------------------------------------------------------
CREATE POLICY "activities_select_own_org"
  ON activities FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "activities_insert_own_org"
  ON activities FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "activities_update_own_org"
  ON activities FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "activities_delete_own_org"
  ON activities FOR DELETE
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

COMMENT ON TABLE activities IS 'Unified activity log for tasks, events, calls, emails, and notes';
COMMENT ON COLUMN activities.related_to_type IS 'Polymorphic type: lead, contact, account, deal, or ticket';
COMMENT ON COLUMN activities.related_to_id IS 'UUID of the related entity (not FK-constrained due to polymorphism)';
