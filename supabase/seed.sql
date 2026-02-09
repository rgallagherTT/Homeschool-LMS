-- Seed Data for Zoho CRM Plus Clone
-- Description: Default organization, roles, and sales pipeline for development/testing

-- ============================================================
-- DEMO ORGANIZATION
-- ============================================================
INSERT INTO public.organizations (
    id,
    name,
    subdomain,
    industry,
    size,
    timezone,
    currency,
    subscription_plan,
    is_active,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo Organization',
    'demo',
    'Technology',
    '11-50',
    'UTC',
    'USD',
    'professional',
    true,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DEFAULT ROLES
-- ============================================================

-- Admin role: full access to everything
INSERT INTO public.roles (
    id,
    organization_id,
    name,
    permissions,
    is_default,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'admin',
    '{
        "leads": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true},
        "contacts": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true},
        "accounts": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true},
        "deals": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true},
        "pipelines": {"create": true, "read": true, "update": true, "delete": true},
        "activities": {"create": true, "read": true, "update": true, "delete": true},
        "tickets": {"create": true, "read": true, "update": true, "delete": true},
        "campaigns": {"create": true, "read": true, "update": true, "delete": true},
        "reports": {"create": true, "read": true, "update": true, "delete": true},
        "settings": {"read": true, "update": true},
        "users": {"create": true, "read": true, "update": true, "delete": true},
        "roles": {"create": true, "read": true, "update": true, "delete": true},
        "organization": {"read": true, "update": true}
    }'::JSONB,
    false,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Sales Manager role: full CRM access, limited admin
INSERT INTO public.roles (
    id,
    organization_id,
    name,
    permissions,
    is_default,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'sales_manager',
    '{
        "leads": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true},
        "contacts": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true},
        "accounts": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true},
        "deals": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true},
        "pipelines": {"create": false, "read": true, "update": false, "delete": false},
        "activities": {"create": true, "read": true, "update": true, "delete": true},
        "tickets": {"create": true, "read": true, "update": true, "delete": false},
        "campaigns": {"create": true, "read": true, "update": true, "delete": false},
        "reports": {"create": true, "read": true, "update": true, "delete": false},
        "settings": {"read": true, "update": false},
        "users": {"create": false, "read": true, "update": false, "delete": false},
        "roles": {"create": false, "read": true, "update": false, "delete": false},
        "organization": {"read": true, "update": false}
    }'::JSONB,
    false,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Sales Rep role (DEFAULT): standard CRM access, own records focus
INSERT INTO public.roles (
    id,
    organization_id,
    name,
    permissions,
    is_default,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000001',
    'sales_rep',
    '{
        "leads": {"create": true, "read": true, "update": true, "delete": false, "export": false, "import": false},
        "contacts": {"create": true, "read": true, "update": true, "delete": false, "export": false, "import": false},
        "accounts": {"create": true, "read": true, "update": true, "delete": false, "export": false, "import": false},
        "deals": {"create": true, "read": true, "update": true, "delete": false, "export": false, "import": false},
        "pipelines": {"create": false, "read": true, "update": false, "delete": false},
        "activities": {"create": true, "read": true, "update": true, "delete": false},
        "tickets": {"create": true, "read": true, "update": false, "delete": false},
        "campaigns": {"create": false, "read": true, "update": false, "delete": false},
        "reports": {"create": false, "read": true, "update": false, "delete": false},
        "settings": {"read": false, "update": false},
        "users": {"create": false, "read": true, "update": false, "delete": false},
        "roles": {"create": false, "read": true, "update": false, "delete": false},
        "organization": {"read": true, "update": false}
    }'::JSONB,
    true,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Support Agent role: tickets focus with contact read access
INSERT INTO public.roles (
    id,
    organization_id,
    name,
    permissions,
    is_default,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000001',
    'support_agent',
    '{
        "leads": {"create": false, "read": false, "update": false, "delete": false, "export": false, "import": false},
        "contacts": {"create": false, "read": true, "update": false, "delete": false, "export": false, "import": false},
        "accounts": {"create": false, "read": true, "update": false, "delete": false, "export": false, "import": false},
        "deals": {"create": false, "read": false, "update": false, "delete": false, "export": false, "import": false},
        "pipelines": {"create": false, "read": false, "update": false, "delete": false},
        "activities": {"create": true, "read": true, "update": true, "delete": false},
        "tickets": {"create": true, "read": true, "update": true, "delete": false},
        "campaigns": {"create": false, "read": false, "update": false, "delete": false},
        "reports": {"create": false, "read": true, "update": false, "delete": false},
        "settings": {"read": false, "update": false},
        "users": {"create": false, "read": true, "update": false, "delete": false},
        "roles": {"create": false, "read": true, "update": false, "delete": false},
        "organization": {"read": true, "update": false}
    }'::JSONB,
    false,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DEFAULT SALES PIPELINE
-- ============================================================
INSERT INTO public.pipelines (
    id,
    organization_id,
    name,
    is_default,
    stages,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    'Default Sales Pipeline',
    true,
    '[
        {
            "id": "stage-prospecting",
            "name": "Prospecting",
            "probability": 10,
            "order": 1
        },
        {
            "id": "stage-qualification",
            "name": "Qualification",
            "probability": 20,
            "order": 2
        },
        {
            "id": "stage-needs-analysis",
            "name": "Needs Analysis",
            "probability": 40,
            "order": 3
        },
        {
            "id": "stage-proposal",
            "name": "Proposal",
            "probability": 60,
            "order": 4
        },
        {
            "id": "stage-negotiation",
            "name": "Negotiation",
            "probability": 80,
            "order": 5
        },
        {
            "id": "stage-closed-won",
            "name": "Closed Won",
            "probability": 100,
            "order": 6
        },
        {
            "id": "stage-closed-lost",
            "name": "Closed Lost",
            "probability": 0,
            "order": 7
        }
    ]'::JSONB,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;
