-- ============================================================================
-- Seed Data for Zoho CRM Plus Clone - Phase 1 MVP
-- Description: Creates a default organization, admin/sales roles, and a
--              default sales pipeline with standard stages
-- ============================================================================

-- -------------------------------------------------------
-- 1. Default Organization
-- -------------------------------------------------------
INSERT INTO organizations (id, name, subdomain, industry, size, timezone, currency, subscription_plan, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Organization',
  'default',
  'Technology',
  '11-50',
  'UTC',
  'USD',
  'professional',
  true
);

-- -------------------------------------------------------
-- 2. Default Roles
-- -------------------------------------------------------

-- Admin role (full access)
INSERT INTO roles (id, organization_id, name, permissions, is_default)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  '{
    "leads":      {"create": true, "read": true, "update": true, "delete": true},
    "contacts":   {"create": true, "read": true, "update": true, "delete": true},
    "accounts":   {"create": true, "read": true, "update": true, "delete": true},
    "deals":      {"create": true, "read": true, "update": true, "delete": true},
    "pipelines":  {"create": true, "read": true, "update": true, "delete": true},
    "activities": {"create": true, "read": true, "update": true, "delete": true},
    "tickets":    {"create": true, "read": true, "update": true, "delete": true},
    "campaigns":  {"create": true, "read": true, "update": true, "delete": true},
    "reports":    {"create": true, "read": true, "update": true, "delete": true},
    "settings":   {"create": true, "read": true, "update": true, "delete": true},
    "users":      {"create": true, "read": true, "update": true, "delete": true}
  }',
  false
);

-- Sales Manager role
INSERT INTO roles (id, organization_id, name, permissions, is_default)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'sales_manager',
  '{
    "leads":      {"create": true, "read": true, "update": true, "delete": false},
    "contacts":   {"create": true, "read": true, "update": true, "delete": false},
    "accounts":   {"create": true, "read": true, "update": true, "delete": false},
    "deals":      {"create": true, "read": true, "update": true, "delete": false},
    "pipelines":  {"create": false, "read": true, "update": false, "delete": false},
    "activities": {"create": true, "read": true, "update": true, "delete": true},
    "tickets":    {"create": true, "read": true, "update": true, "delete": false},
    "campaigns":  {"create": true, "read": true, "update": true, "delete": false},
    "reports":    {"create": true, "read": true, "update": false, "delete": false},
    "settings":   {"create": false, "read": true, "update": false, "delete": false},
    "users":      {"create": false, "read": true, "update": false, "delete": false}
  }',
  false
);

-- Sales Rep role (default for new users)
INSERT INTO roles (id, organization_id, name, permissions, is_default)
VALUES (
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000001',
  'sales_rep',
  '{
    "leads":      {"create": true, "read": true, "update": true, "delete": false},
    "contacts":   {"create": true, "read": true, "update": true, "delete": false},
    "accounts":   {"create": true, "read": true, "update": true, "delete": false},
    "deals":      {"create": true, "read": true, "update": true, "delete": false},
    "pipelines":  {"create": false, "read": true, "update": false, "delete": false},
    "activities": {"create": true, "read": true, "update": true, "delete": true},
    "tickets":    {"create": true, "read": true, "update": true, "delete": false},
    "campaigns":  {"create": false, "read": true, "update": false, "delete": false},
    "reports":    {"create": false, "read": true, "update": false, "delete": false},
    "settings":   {"create": false, "read": false, "update": false, "delete": false},
    "users":      {"create": false, "read": true, "update": false, "delete": false}
  }',
  true
);

-- Support Agent role
INSERT INTO roles (id, organization_id, name, permissions, is_default)
VALUES (
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000001',
  'support_agent',
  '{
    "leads":      {"create": false, "read": true, "update": false, "delete": false},
    "contacts":   {"create": true, "read": true, "update": true, "delete": false},
    "accounts":   {"create": false, "read": true, "update": false, "delete": false},
    "deals":      {"create": false, "read": true, "update": false, "delete": false},
    "pipelines":  {"create": false, "read": true, "update": false, "delete": false},
    "activities": {"create": true, "read": true, "update": true, "delete": false},
    "tickets":    {"create": true, "read": true, "update": true, "delete": false},
    "campaigns":  {"create": false, "read": false, "update": false, "delete": false},
    "reports":    {"create": false, "read": true, "update": false, "delete": false},
    "settings":   {"create": false, "read": false, "update": false, "delete": false},
    "users":      {"create": false, "read": true, "update": false, "delete": false}
  }',
  false
);

-- -------------------------------------------------------
-- 3. Default Sales Pipeline with Standard Stages
-- -------------------------------------------------------
INSERT INTO pipelines (id, organization_id, name, is_default, stages)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'Default Sales Pipeline',
  true,
  '[
    {"id": "prospecting",    "name": "Prospecting",     "probability": 10, "order": 1},
    {"id": "qualification",  "name": "Qualification",   "probability": 20, "order": 2},
    {"id": "needs_analysis", "name": "Needs Analysis",  "probability": 40, "order": 3},
    {"id": "proposal",       "name": "Proposal",        "probability": 60, "order": 4},
    {"id": "negotiation",    "name": "Negotiation",     "probability": 80, "order": 5},
    {"id": "closed_won",     "name": "Closed Won",      "probability": 100, "order": 6},
    {"id": "closed_lost",    "name": "Closed Lost",     "probability": 0,  "order": 7}
  ]'
);

-- -------------------------------------------------------
-- 4. Sample Ticket Categories (for reference)
-- -------------------------------------------------------
-- Note: These are not stored in a separate table but document
-- suggested default categories for the tickets.category field:
--   - 'billing'
--   - 'technical_support'
--   - 'feature_request'
--   - 'bug_report'
--   - 'account_management'
--   - 'general_inquiry'

-- -------------------------------------------------------
-- 5. Sample Lead Sources (for reference)
-- -------------------------------------------------------
-- Suggested values for leads.source field:
--   - 'website'
--   - 'referral'
--   - 'cold_call'
--   - 'social_media'
--   - 'trade_show'
--   - 'advertisement'
--   - 'partner'
--   - 'other'
