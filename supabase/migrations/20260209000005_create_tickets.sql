-- Migration: Create tickets and ticket_comments tables
-- Description: Help desk / customer support ticket system

-- ============================================================
-- TICKET NUMBER SEQUENCE
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.ticket_number_seq START 1;

-- ============================================================
-- TICKETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ticket_number TEXT UNIQUE,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')) DEFAULT 'open',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    category TEXT,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    team_id UUID,
    channel TEXT,
    sla_due_at TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    satisfaction_rating INT CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.tickets IS 'Customer support tickets with SLA tracking, categorization, and satisfaction ratings.';
COMMENT ON COLUMN public.tickets.ticket_number IS 'Human-readable ticket identifier, auto-generated as TKT-XXXXX.';
COMMENT ON COLUMN public.tickets.channel IS 'Source channel: email, phone, chat, web, social, etc.';
COMMENT ON COLUMN public.tickets.tags IS 'Array of text tags for flexible categorization.';

-- ============================================================
-- TICKET COMMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    contact_id UUID,
    body TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.ticket_comments IS 'Comments / replies on tickets. Internal notes are hidden from customers.';
COMMENT ON COLUMN public.ticket_comments.is_internal IS 'If true, this comment is an internal note not visible to the customer.';
COMMENT ON COLUMN public.ticket_comments.attachments IS 'JSON array of attachment objects: [{"name": "file.pdf", "url": "...", "size": 1024}]';

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_tickets_org_status ON public.tickets(organization_id, status);
CREATE INDEX idx_tickets_org_priority ON public.tickets(organization_id, priority);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX idx_tickets_contact_id ON public.tickets(contact_id);
CREATE INDEX idx_tickets_account_id ON public.tickets(account_id);

CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
