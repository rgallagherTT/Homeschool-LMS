-- ============================================================================
-- Migration: Create Row Level Security (RLS) Policies
-- Description: Comprehensive RLS policies for all tables
-- ============================================================================

-- ============================================================================
-- HELPER: Function to get current user's family_id
-- ============================================================================
CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS TEXT AS $$
  SELECT f.id
  FROM families f
  WHERE f.parent_id = auth.uid()::text
  UNION
  SELECT s.family_id
  FROM students s
  WHERE s.user_id = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Check if current user is a parent
CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'PARENT'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Check if current user is a student
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'STUDENT'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Get current user's student ID
CREATE OR REPLACE FUNCTION get_my_student_id()
RETURNS TEXT AS $$
  SELECT s.id
  FROM students s
  WHERE s.user_id = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- PROFILES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid()::text);

-- Parents can also read profiles of students in their family
CREATE POLICY "profiles_select_family_students"
  ON profiles FOR SELECT
  USING (
    is_parent() AND
    id IN (
      SELECT s.user_id FROM students s
      WHERE s.family_id = get_my_family_id()
    )
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- ============================================================================
-- FAMILIES
-- ============================================================================

-- Parent can read their own family
CREATE POLICY "families_select_own"
  ON families FOR SELECT
  USING (parent_id = auth.uid()::text);

-- Students can read their family
CREATE POLICY "families_select_student"
  ON families FOR SELECT
  USING (
    is_student() AND
    id = get_my_family_id()
  );

-- Parent can insert a family (only for themselves)
CREATE POLICY "families_insert_own"
  ON families FOR INSERT
  WITH CHECK (parent_id = auth.uid()::text);

-- Parent can update their own family
CREATE POLICY "families_update_own"
  ON families FOR UPDATE
  USING (parent_id = auth.uid()::text)
  WITH CHECK (parent_id = auth.uid()::text);

-- Parent can delete their own family
CREATE POLICY "families_delete_own"
  ON families FOR DELETE
  USING (parent_id = auth.uid()::text);

-- ============================================================================
-- STUDENTS
-- ============================================================================

-- Parent can read students in their family
CREATE POLICY "students_select_parent"
  ON students FOR SELECT
  USING (
    is_parent() AND
    family_id = get_my_family_id()
  );

-- Student can read their own record
CREATE POLICY "students_select_own"
  ON students FOR SELECT
  USING (user_id = auth.uid()::text);

-- Parent can insert students into their family
CREATE POLICY "students_insert_parent"
  ON students FOR INSERT
  WITH CHECK (
    is_parent() AND
    family_id = get_my_family_id()
  );

-- Parent can update students in their family
CREATE POLICY "students_update_parent"
  ON students FOR UPDATE
  USING (
    is_parent() AND
    family_id = get_my_family_id()
  )
  WITH CHECK (
    is_parent() AND
    family_id = get_my_family_id()
  );

-- Parent can delete students from their family
CREATE POLICY "students_delete_parent"
  ON students FOR DELETE
  USING (
    is_parent() AND
    family_id = get_my_family_id()
  );

-- ============================================================================
-- COURSES
-- ============================================================================

-- Everyone can read catalog courses (non-custom)
CREATE POLICY "courses_select_catalog"
  ON courses FOR SELECT
  USING (is_custom = false);

-- Parent can read their own custom courses
CREATE POLICY "courses_select_custom_own"
  ON courses FOR SELECT
  USING (
    is_custom = true AND
    created_by = get_my_family_id()
  );

-- Parent can insert custom courses
CREATE POLICY "courses_insert_custom"
  ON courses FOR INSERT
  WITH CHECK (
    is_parent() AND
    is_custom = true AND
    created_by = get_my_family_id()
  );

-- Parent can update their own custom courses
CREATE POLICY "courses_update_custom"
  ON courses FOR UPDATE
  USING (
    is_parent() AND
    is_custom = true AND
    created_by = get_my_family_id()
  )
  WITH CHECK (
    is_parent() AND
    is_custom = true AND
    created_by = get_my_family_id()
  );

-- Parent can delete their own custom courses
CREATE POLICY "courses_delete_custom"
  ON courses FOR DELETE
  USING (
    is_parent() AND
    is_custom = true AND
    created_by = get_my_family_id()
  );

-- ============================================================================
-- LESSONS
-- ============================================================================

-- Everyone can read lessons for catalog courses
CREATE POLICY "lessons_select_catalog"
  ON lessons FOR SELECT
  USING (
    course_id IN (SELECT id FROM courses WHERE is_custom = false)
  );

-- Parent can read lessons for their custom courses
CREATE POLICY "lessons_select_custom"
  ON lessons FOR SELECT
  USING (
    course_id IN (
      SELECT id FROM courses
      WHERE is_custom = true AND created_by = get_my_family_id()
    )
  );

-- Students can read lessons for courses they are enrolled in
CREATE POLICY "lessons_select_enrolled"
  ON lessons FOR SELECT
  USING (
    is_student() AND
    course_id IN (
      SELECT e.course_id FROM enrollments e
      WHERE e.student_id = get_my_student_id()
    )
  );

-- Parent can insert lessons for their custom courses
CREATE POLICY "lessons_insert_custom"
  ON lessons FOR INSERT
  WITH CHECK (
    is_parent() AND
    course_id IN (
      SELECT id FROM courses
      WHERE is_custom = true AND created_by = get_my_family_id()
    )
  );

-- Parent can update lessons for their custom courses
CREATE POLICY "lessons_update_custom"
  ON lessons FOR UPDATE
  USING (
    is_parent() AND
    course_id IN (
      SELECT id FROM courses
      WHERE is_custom = true AND created_by = get_my_family_id()
    )
  );

-- Parent can delete lessons for their custom courses
CREATE POLICY "lessons_delete_custom"
  ON lessons FOR DELETE
  USING (
    is_parent() AND
    course_id IN (
      SELECT id FROM courses
      WHERE is_custom = true AND created_by = get_my_family_id()
    )
  );

-- ============================================================================
-- RESOURCES
-- ============================================================================

-- Everyone can read resources for catalog course lessons
CREATE POLICY "resources_select_catalog"
  ON resources FOR SELECT
  USING (
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE c.is_custom = false
    )
  );

-- Parent can read resources for their custom course lessons
CREATE POLICY "resources_select_custom"
  ON resources FOR SELECT
  USING (
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE c.is_custom = true AND c.created_by = get_my_family_id()
    )
  );

-- Students can read resources for lessons in courses they are enrolled in
CREATE POLICY "resources_select_enrolled"
  ON resources FOR SELECT
  USING (
    is_student() AND
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN enrollments e ON e.course_id = l.course_id
      WHERE e.student_id = get_my_student_id()
    )
  );

-- Parent can insert resources for their custom course lessons
CREATE POLICY "resources_insert_custom"
  ON resources FOR INSERT
  WITH CHECK (
    is_parent() AND
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE c.is_custom = true AND c.created_by = get_my_family_id()
    )
  );

-- Parent can update resources for their custom course lessons
CREATE POLICY "resources_update_custom"
  ON resources FOR UPDATE
  USING (
    is_parent() AND
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE c.is_custom = true AND c.created_by = get_my_family_id()
    )
  );

-- Parent can delete resources for their custom course lessons
CREATE POLICY "resources_delete_custom"
  ON resources FOR DELETE
  USING (
    is_parent() AND
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE c.is_custom = true AND c.created_by = get_my_family_id()
    )
  );

-- ============================================================================
-- ASSIGNMENTS
-- ============================================================================

-- Everyone can read assignments for catalog course lessons
CREATE POLICY "assignments_select_catalog"
  ON assignments FOR SELECT
  USING (
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE c.is_custom = false
    )
  );

-- Parent can read assignments for their custom course lessons
CREATE POLICY "assignments_select_custom"
  ON assignments FOR SELECT
  USING (
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE c.is_custom = true AND c.created_by = get_my_family_id()
    )
  );

-- Students can read assignments for lessons in courses they are enrolled in
CREATE POLICY "assignments_select_enrolled"
  ON assignments FOR SELECT
  USING (
    is_student() AND
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN enrollments e ON e.course_id = l.course_id
      WHERE e.student_id = get_my_student_id()
    )
  );

-- Parent can insert assignments for their custom course lessons
CREATE POLICY "assignments_insert_custom"
  ON assignments FOR INSERT
  WITH CHECK (
    is_parent() AND
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE c.is_custom = true AND c.created_by = get_my_family_id()
    )
  );

-- Parent can update assignments for their custom course lessons
CREATE POLICY "assignments_update_custom"
  ON assignments FOR UPDATE
  USING (
    is_parent() AND
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE c.is_custom = true AND c.created_by = get_my_family_id()
    )
  );

-- Parent can delete assignments for their custom course lessons
CREATE POLICY "assignments_delete_custom"
  ON assignments FOR DELETE
  USING (
    is_parent() AND
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE c.is_custom = true AND c.created_by = get_my_family_id()
    )
  );

-- ============================================================================
-- SUBMISSIONS
-- ============================================================================

-- Parent can read submissions for students in their family
CREATE POLICY "submissions_select_parent"
  ON submissions FOR SELECT
  USING (
    is_parent() AND
    student_id IN (
      SELECT s.id FROM students s
      WHERE s.family_id = get_my_family_id()
    )
  );

-- Student can read their own submissions
CREATE POLICY "submissions_select_student"
  ON submissions FOR SELECT
  USING (
    is_student() AND
    student_id = get_my_student_id()
  );

-- Parent can insert submissions for students in their family
CREATE POLICY "submissions_insert_parent"
  ON submissions FOR INSERT
  WITH CHECK (
    is_parent() AND
    student_id IN (
      SELECT s.id FROM students s
      WHERE s.family_id = get_my_family_id()
    )
  );

-- Student can insert their own submissions
CREATE POLICY "submissions_insert_student"
  ON submissions FOR INSERT
  WITH CHECK (
    is_student() AND
    student_id = get_my_student_id()
  );

-- Parent can update submissions for students in their family (grading)
CREATE POLICY "submissions_update_parent"
  ON submissions FOR UPDATE
  USING (
    is_parent() AND
    student_id IN (
      SELECT s.id FROM students s
      WHERE s.family_id = get_my_family_id()
    )
  )
  WITH CHECK (
    is_parent() AND
    student_id IN (
      SELECT s.id FROM students s
      WHERE s.family_id = get_my_family_id()
    )
  );

-- Student can update their own submissions (submitting work)
CREATE POLICY "submissions_update_student"
  ON submissions FOR UPDATE
  USING (
    is_student() AND
    student_id = get_my_student_id()
  )
  WITH CHECK (
    is_student() AND
    student_id = get_my_student_id()
  );

-- Parent can delete submissions for students in their family
CREATE POLICY "submissions_delete_parent"
  ON submissions FOR DELETE
  USING (
    is_parent() AND
    student_id IN (
      SELECT s.id FROM students s
      WHERE s.family_id = get_my_family_id()
    )
  );

-- ============================================================================
-- ENROLLMENTS
-- ============================================================================

-- Parent can read enrollments for students in their family
CREATE POLICY "enrollments_select_parent"
  ON enrollments FOR SELECT
  USING (
    is_parent() AND
    student_id IN (
      SELECT s.id FROM students s
      WHERE s.family_id = get_my_family_id()
    )
  );

-- Student can read their own enrollments
CREATE POLICY "enrollments_select_student"
  ON enrollments FOR SELECT
  USING (
    is_student() AND
    student_id = get_my_student_id()
  );

-- Parent can insert enrollments for students in their family
CREATE POLICY "enrollments_insert_parent"
  ON enrollments FOR INSERT
  WITH CHECK (
    is_parent() AND
    student_id IN (
      SELECT s.id FROM students s
      WHERE s.family_id = get_my_family_id()
    )
  );

-- Parent can update enrollments for students in their family
CREATE POLICY "enrollments_update_parent"
  ON enrollments FOR UPDATE
  USING (
    is_parent() AND
    student_id IN (
      SELECT s.id FROM students s
      WHERE s.family_id = get_my_family_id()
    )
  )
  WITH CHECK (
    is_parent() AND
    student_id IN (
      SELECT s.id FROM students s
      WHERE s.family_id = get_my_family_id()
    )
  );

-- Parent can delete enrollments for students in their family
CREATE POLICY "enrollments_delete_parent"
  ON enrollments FOR DELETE
  USING (
    is_parent() AND
    student_id IN (
      SELECT s.id FROM students s
      WHERE s.family_id = get_my_family_id()
    )
  );

-- ============================================================================
-- SCHEDULED ITEMS
-- ============================================================================

-- Parent can read scheduled items for their family's enrollments
CREATE POLICY "scheduled_items_select_parent"
  ON scheduled_items FOR SELECT
  USING (
    is_parent() AND
    enrollment_id IN (
      SELECT e.id FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE s.family_id = get_my_family_id()
    )
  );

-- Student can read their own scheduled items
CREATE POLICY "scheduled_items_select_student"
  ON scheduled_items FOR SELECT
  USING (
    is_student() AND
    enrollment_id IN (
      SELECT e.id FROM enrollments e
      WHERE e.student_id = get_my_student_id()
    )
  );

-- Parent can insert scheduled items for their family's enrollments
CREATE POLICY "scheduled_items_insert_parent"
  ON scheduled_items FOR INSERT
  WITH CHECK (
    is_parent() AND
    enrollment_id IN (
      SELECT e.id FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE s.family_id = get_my_family_id()
    )
  );

-- Parent can update scheduled items for their family's enrollments
CREATE POLICY "scheduled_items_update_parent"
  ON scheduled_items FOR UPDATE
  USING (
    is_parent() AND
    enrollment_id IN (
      SELECT e.id FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE s.family_id = get_my_family_id()
    )
  )
  WITH CHECK (
    is_parent() AND
    enrollment_id IN (
      SELECT e.id FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE s.family_id = get_my_family_id()
    )
  );

-- Parent can delete scheduled items for their family's enrollments
CREATE POLICY "scheduled_items_delete_parent"
  ON scheduled_items FOR DELETE
  USING (
    is_parent() AND
    enrollment_id IN (
      SELECT e.id FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE s.family_id = get_my_family_id()
    )
  );

-- ============================================================================
-- CALENDAR EVENTS
-- ============================================================================

-- Parent can read their family's calendar events
CREATE POLICY "calendar_events_select_parent"
  ON calendar_events FOR SELECT
  USING (
    is_parent() AND
    family_id = get_my_family_id()
  );

-- Student can read their family's calendar events
CREATE POLICY "calendar_events_select_student"
  ON calendar_events FOR SELECT
  USING (
    is_student() AND
    family_id = get_my_family_id()
  );

-- Parent can insert calendar events for their family
CREATE POLICY "calendar_events_insert_parent"
  ON calendar_events FOR INSERT
  WITH CHECK (
    is_parent() AND
    family_id = get_my_family_id()
  );

-- Parent can update their family's calendar events
CREATE POLICY "calendar_events_update_parent"
  ON calendar_events FOR UPDATE
  USING (
    is_parent() AND
    family_id = get_my_family_id()
  )
  WITH CHECK (
    is_parent() AND
    family_id = get_my_family_id()
  );

-- Parent can delete their family's calendar events
CREATE POLICY "calendar_events_delete_parent"
  ON calendar_events FOR DELETE
  USING (
    is_parent() AND
    family_id = get_my_family_id()
  );

-- ============================================================================
-- GRADING SCALES
-- ============================================================================

-- Parent can read their family's grading scale
CREATE POLICY "grading_scales_select_parent"
  ON grading_scales FOR SELECT
  USING (
    is_parent() AND
    family_id = get_my_family_id()
  );

-- Student can read their family's grading scale
CREATE POLICY "grading_scales_select_student"
  ON grading_scales FOR SELECT
  USING (
    is_student() AND
    family_id = get_my_family_id()
  );

-- Parent can insert a grading scale for their family
CREATE POLICY "grading_scales_insert_parent"
  ON grading_scales FOR INSERT
  WITH CHECK (
    is_parent() AND
    family_id = get_my_family_id()
  );

-- Parent can update their family's grading scale
CREATE POLICY "grading_scales_update_parent"
  ON grading_scales FOR UPDATE
  USING (
    is_parent() AND
    family_id = get_my_family_id()
  )
  WITH CHECK (
    is_parent() AND
    family_id = get_my_family_id()
  );

-- Parent can delete their family's grading scale
CREATE POLICY "grading_scales_delete_parent"
  ON grading_scales FOR DELETE
  USING (
    is_parent() AND
    family_id = get_my_family_id()
  );

-- ============================================================================
-- GRADING SCALE ENTRIES
-- ============================================================================

-- Parent can read grading scale entries for their family's scale
CREATE POLICY "grading_scale_entries_select_parent"
  ON grading_scale_entries FOR SELECT
  USING (
    is_parent() AND
    grading_scale_id IN (
      SELECT gs.id FROM grading_scales gs
      WHERE gs.family_id = get_my_family_id()
    )
  );

-- Student can read grading scale entries for their family's scale
CREATE POLICY "grading_scale_entries_select_student"
  ON grading_scale_entries FOR SELECT
  USING (
    is_student() AND
    grading_scale_id IN (
      SELECT gs.id FROM grading_scales gs
      WHERE gs.family_id = get_my_family_id()
    )
  );

-- Parent can insert grading scale entries for their family's scale
CREATE POLICY "grading_scale_entries_insert_parent"
  ON grading_scale_entries FOR INSERT
  WITH CHECK (
    is_parent() AND
    grading_scale_id IN (
      SELECT gs.id FROM grading_scales gs
      WHERE gs.family_id = get_my_family_id()
    )
  );

-- Parent can update grading scale entries for their family's scale
CREATE POLICY "grading_scale_entries_update_parent"
  ON grading_scale_entries FOR UPDATE
  USING (
    is_parent() AND
    grading_scale_id IN (
      SELECT gs.id FROM grading_scales gs
      WHERE gs.family_id = get_my_family_id()
    )
  )
  WITH CHECK (
    is_parent() AND
    grading_scale_id IN (
      SELECT gs.id FROM grading_scales gs
      WHERE gs.family_id = get_my_family_id()
    )
  );

-- Parent can delete grading scale entries for their family's scale
CREATE POLICY "grading_scale_entries_delete_parent"
  ON grading_scale_entries FOR DELETE
  USING (
    is_parent() AND
    grading_scale_id IN (
      SELECT gs.id FROM grading_scales gs
      WHERE gs.family_id = get_my_family_id()
    )
  );
