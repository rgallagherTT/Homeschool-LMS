-- ============================================================================
-- Migration: Create Scheduling Tables
-- Description: Enrollments, Scheduled Items, Calendar Events
-- ============================================================================

-- Enrollments
CREATE TABLE enrollments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  days_of_week TEXT[] DEFAULT '{"MO","TU","WE","TH","FR"}',
  lessons_per_day INT DEFAULT 1,
  alternating BOOLEAN DEFAULT false,
  UNIQUE(student_id, course_id)
);

-- Scheduled Items (individual lesson-date pairs)
CREATE TABLE scheduled_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  enrollment_id TEXT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'COMPLETED', 'SKIPPED', 'RESCHEDULED'))
);

-- Calendar Events
CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  all_day BOOLEAN DEFAULT true,
  event_type TEXT NOT NULL,  -- vacation, field_trip, special, day_off
  notes TEXT
);

-- Enable RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_scheduled_items_enrollment ON scheduled_items(enrollment_id);
CREATE INDEX idx_scheduled_items_date ON scheduled_items(enrollment_id, date);
CREATE INDEX idx_scheduled_items_lesson ON scheduled_items(lesson_id);
CREATE INDEX idx_calendar_events_family ON calendar_events(family_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);
