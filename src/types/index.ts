// ============================================================
// Enums
// ============================================================

export enum Role {
  Parent = "parent",
  Student = "student",
}

export enum ResourceType {
  Link = "link",
  File = "file",
  Video = "video",
  Document = "document",
  Image = "image",
}

export enum AssignmentType {
  Homework = "homework",
  Quiz = "quiz",
  Test = "test",
  Project = "project",
  Essay = "essay",
  Worksheet = "worksheet",
  Reading = "reading",
  Other = "other",
}

export enum SubmissionStatus {
  NotStarted = "not_started",
  InProgress = "in_progress",
  Submitted = "submitted",
  Graded = "graded",
  Returned = "returned",
  Late = "late",
  Excused = "excused",
}

export enum ScheduledStatus {
  Scheduled = "scheduled",
  InProgress = "in_progress",
  Completed = "completed",
  Skipped = "skipped",
  Cancelled = "cancelled",
}

// ============================================================
// Core Types
// ============================================================

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: Role;
  family_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  owner_id: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string | null;
  family_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  grade_level: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Course & Lesson Types
// ============================================================

export interface Course {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  subject: string;
  grade_level: string | null;
  color: string | null;
  icon: string | null;
  is_archived: boolean;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  content: string | null;
  order_index: number;
  duration_minutes: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  lesson_id: string | null;
  course_id: string | null;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Assignment & Submission Types
// ============================================================

export interface Assignment {
  id: string;
  course_id: string;
  lesson_id: string | null;
  title: string;
  description: string | null;
  type: AssignmentType;
  due_date: string | null;
  max_score: number | null;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: SubmissionStatus;
  content: string | null;
  file_url: string | null;
  score: number | null;
  feedback: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  graded_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Enrollment & Schedule Types
// ============================================================

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledItem {
  id: string;
  family_id: string;
  student_id: string;
  course_id: string | null;
  lesson_id: string | null;
  assignment_id: string | null;
  title: string;
  description: string | null;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  status: ScheduledStatus;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  color: string | null;
  recurrence_rule: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Grading Types
// ============================================================

export interface GradingScale {
  id: string;
  family_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface GradingScaleEntry {
  id: string;
  grading_scale_id: string;
  letter_grade: string;
  min_percentage: number;
  max_percentage: number;
  gpa_value: number | null;
  created_at: string;
}
