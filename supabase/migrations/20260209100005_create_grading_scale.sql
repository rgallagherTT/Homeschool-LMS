-- ============================================================================
-- Migration: Create Grading Scale Tables
-- Description: Per-family grading scales with letter grade entries
-- ============================================================================

-- Grading Scale (per family)
CREATE TABLE grading_scales (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  family_id TEXT UNIQUE NOT NULL REFERENCES families(id) ON DELETE CASCADE
);

-- Grading Scale Entries
CREATE TABLE grading_scale_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  grading_scale_id TEXT NOT NULL REFERENCES grading_scales(id) ON DELETE CASCADE,
  letter TEXT NOT NULL,
  min_percent FLOAT NOT NULL,
  max_percent FLOAT NOT NULL,
  gpa_points FLOAT NOT NULL
);

-- Enable RLS
ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_scale_entries ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_grading_scale_entries_scale ON grading_scale_entries(grading_scale_id);
