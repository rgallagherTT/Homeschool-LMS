-- ============================================================================
-- Migration: Create Assignments & Grading Tables
-- Description: Assignments, Submissions
-- ============================================================================

-- Assignments
CREATE TABLE assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('HOMEWORK', 'QUIZ', 'TEST', 'PROJECT', 'READING', 'ACTIVITY')),
  max_points FLOAT NOT NULL,
  is_auto_graded BOOLEAN DEFAULT false,
  answer_key_url TEXT
);

-- Submissions
CREATE TABLE submissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'SKIPPED')),
  points_earned FLOAT,
  graded_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT false,
  retake_allowed BOOLEAN DEFAULT false,
  answers JSONB,
  UNIQUE(assignment_id, student_id)
);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_assignments_lesson_id ON assignments(lesson_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_status ON submissions(status);
