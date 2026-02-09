-- ============================================================================
-- Migration: Create Courses & Curriculum Tables
-- Description: Courses, Lessons, Resources
-- ============================================================================

-- Courses
CREATE TABLE courses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  description TEXT,
  is_custom BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  created_by TEXT,  -- family_id for custom courses
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lessons
CREATE TABLE lessons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sequence_order INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_min INT,
  materials TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Resources (PDFs, handouts, answer keys)
CREATE TABLE resources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('TEACHER_EDITION_PDF', 'STUDENT_HANDOUT', 'QUIZ_FILE', 'ANSWER_KEY', 'OTHER')),
  file_url TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_lessons_sequence ON lessons(course_id, sequence_order);
CREATE INDEX idx_resources_lesson_id ON resources(lesson_id);
