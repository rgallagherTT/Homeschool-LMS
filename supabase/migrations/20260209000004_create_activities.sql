-- Migration: Create activities table
-- Description: Tasks, events, calls, emails, and notes linked to CRM records

CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task', 'event', 'call', 'email', 'note')),
    subject TEXT NOT NULL,
    description TEXT,
    related_to_type TEXT CHECK (related_to_type IN ('lead', 'contact', 'account', 'deal', 'ticket')),
    related_to_id UUID,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.activities IS 'Polymorphic activities (tasks, events, calls, emails, notes) linked to any CRM entity via related_to_type + related_to_id.';
COMMENT ON COLUMN public.activities.related_to_type IS 'The entity type this activity is associated with: lead, contact, account, deal, or ticket.';
COMMENT ON COLUMN public.activities.related_to_id IS 'The UUID of the related entity. Not a foreign key due to polymorphic nature.';

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_activities_org_related
    ON public.activities(organization_id, related_to_type, related_to_id);

CREATE INDEX idx_activities_assigned_completed
    ON public.activities(assigned_to, completed);

CREATE INDEX idx_activities_due_date
    ON public.activities(due_date)
    WHERE completed = false;

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
