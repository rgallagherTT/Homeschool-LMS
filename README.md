# Homeschool Hub Clone — Product Requirements Document

**Project Name:** EduNest — Homeschool Learning Management System
**Version:** 1.0
**Date:** February 8, 2026
**Author:** Product Owner
**Audience:** Claude Code (AI Engineering Agent)

-----

## 1. Executive Summary

EduNest is a full-stack homeschool Learning Management System (LMS) modeled after the BJU Press Homeschool Hub. It is an all-in-one platform that gives homeschool parents the tools to plan schedules, assign courses, track progress, grade assignments, and generate transcripts — while giving students a clean, focused interface to view daily lessons, watch videos, and complete their work.

The platform serves two user roles: **Parent (Admin)** and **Student**. Parents have full control over scheduling, grading, and reporting. Students have a simplified, read-mostly view focused on completing daily work.

-----

## 2. Goals & Success Criteria

|Goal                                                      |Success Metric                                             |
|----------------------------------------------------------|-----------------------------------------------------------|
|Parents can plan an entire school year in under 30 minutes|Onboarding flow completes in ≤10 steps                     |
|Students see exactly what’s due today                     |Dashboard loads in <2s with today’s tasks                  |
|Grading is fast and frictionless                          |Grade entry for a single assignment takes ≤3 clicks        |
|Reports satisfy state requirements                        |Transcript PDF generates with GPA, credits, and course list|
|Works on any device                                       |Fully responsive down to 375px width                       |

-----

## 3. Tech Stack (Recommended)

|Layer               |Technology                                                   |Rationale                                                     |
|--------------------|-------------------------------------------------------------|--------------------------------------------------------------|
|**Frontend**        |Next.js 14+ (App Router) with TypeScript                     |SSR, file-based routing, React Server Components              |
|**Styling**         |Tailwind CSS + shadcn/ui                                     |Rapid, consistent UI; accessible components                   |
|**State Management**|Zustand or React Context                                     |Lightweight, sufficient for this domain                       |
|**Backend / API**   |Next.js API Routes (or separate Express/Fastify if preferred)|Co-located with frontend for simplicity                       |
|**Database**        |PostgreSQL via Prisma ORM                                    |Relational data (students, courses, grades) fits SQL perfectly|
|**Authentication**  |NextAuth.js (Auth.js v5)                                     |Supports credentials, OAuth; role-based access                |
|**File Storage**    |S3-compatible (AWS S3, Cloudflare R2, or MinIO for local dev)|Video lessons, PDFs, handouts                                 |
|**Video Delivery**  |HLS via Mux, Cloudflare Stream, or self-hosted               |Adaptive bitrate streaming                                    |
|**PDF Generation**  |`@react-pdf/renderer` or Puppeteer                           |Transcripts and report cards                                  |
|**Deployment**      |Vercel / Railway / Docker Compose                            |Easy CI/CD                                                    |

-----

## 4. User Roles & Permissions

### 4.1 Parent (Admin)

- Creates and manages family account
- Adds/edits/removes students
- Assigns courses to students
- Configures course schedules (start date, days of week, lessons per day)
- Views and edits calendar (reschedule, skip, add days off)
- Grades assignments (manual point entry)
- Views gradebook with averages
- Generates transcripts, progress reports, and grade reports
- Manages student account visibility settings (e.g., hide gradebook from student)
- Creates custom (non-platform) courses

### 4.2 Student

- Logs into personal account
- Views daily dashboard with today’s tasks
- Marks lessons/assignments as complete
- Watches video lessons
- Takes online quizzes/tests (auto-graded)
- Views own grades (if parent allows)
- Views course progress

-----

## 5. Information Architecture & Navigation

```
Parent View:
├── Dashboard (day-at-a-glance for selected student)
├── Calendar (day / week / month views)
├── Courses (list of all assigned courses per student)
│   └── Course Detail (assignment schedule, resources, PDFs)
├── Assignments (grading queue with answer keys)
├── Gradebook (grade averages, edit grades, grading scale config)
├── Reports
│   ├── Transcript
│   ├── Progress Report
│   └── Course Grade Report
├── Students (manage student profiles)
└── Settings (family profile, account, preferences)

Student View:
├── Dashboard (today's lessons & assignments)
├── My Courses
│   └── Course Detail (lessons, videos, assignments)
├── My Grades (if enabled by parent)
└── Settings (profile, password)
```

-----

## 6. Data Model (Prisma Schema Outline)

Below is the core schema. Claude Code should use this as the starting point for `schema.prisma`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── AUTH & USERS ──────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  role          Role      @default(PARENT)
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  family        Family?   @relation("FamilyParent")
  studentProfile Student?
}

enum Role {
  PARENT
  STUDENT
}

model Family {
  id        String    @id @default(cuid())
  name      String
  parentId  String    @unique
  parent    User      @relation("FamilyParent", fields: [parentId], references: [id])
  students  Student[]
  createdAt DateTime  @default(now())
}

model Student {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  familyId        String
  family          Family   @relation(fields: [familyId], references: [id])
  gradeLevel      String?
  birthDate       DateTime?
  showGradebook   Boolean  @default(true)
  enrollments     Enrollment[]
  submissions     Submission[]
  createdAt       DateTime @default(now())
}

// ─── COURSES & CURRICULUM ──────────────────────────────────

model Course {
  id            String    @id @default(cuid())
  title         String
  subject       String
  gradeLevel    String
  description   String?
  isCustom      Boolean   @default(false)   // true = parent-created course
  thumbnailUrl  String?
  createdAt     DateTime  @default(now())

  lessons       Lesson[]
  enrollments   Enrollment[]
}

model Lesson {
  id            String    @id @default(cuid())
  courseId       String
  course        Course    @relation(fields: [courseId], references: [id])
  sequenceOrder Int
  title         String
  description   String?
  videoUrl      String?
  durationMin   Int?
  materials     String[]  // list of required materials for the day

  assignments   Assignment[]
  resources     Resource[]
}

model Resource {
  id        String       @id @default(cuid())
  lessonId  String
  lesson    Lesson       @relation(fields: [lessonId], references: [id])
  title     String
  type      ResourceType
  fileUrl   String
}

enum ResourceType {
  TEACHER_EDITION_PDF
  STUDENT_HANDOUT
  QUIZ_FILE
  ANSWER_KEY
  OTHER
}

// ─── ASSIGNMENTS & GRADING ─────────────────────────────────

model Assignment {
  id            String         @id @default(cuid())
  lessonId      String
  lesson        Lesson         @relation(fields: [lessonId], references: [id])
  title         String
  type          AssignmentType
  maxPoints     Float
  isAutoGraded  Boolean        @default(false)
  answerKeyUrl  String?

  submissions   Submission[]
}

enum AssignmentType {
  HOMEWORK
  QUIZ
  TEST
  PROJECT
  READING
  ACTIVITY
}

model Submission {
  id            String           @id @default(cuid())
  assignmentId  String
  assignment    Assignment       @relation(fields: [assignmentId], references: [id])
  studentId     String
  student       Student          @relation(fields: [studentId], references: [id])
  status        SubmissionStatus @default(NOT_STARTED)
  pointsEarned  Float?
  gradedAt      DateTime?
  submittedAt   DateTime?
  skipped       Boolean          @default(false)
  retakeAllowed Boolean          @default(false)
  answers       Json?            // for auto-graded quizzes

  @@unique([assignmentId, studentId])
}

enum SubmissionStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  GRADED
  SKIPPED
}

// ─── SCHEDULING ────────────────────────────────────────────

model Enrollment {
  id              String   @id @default(cuid())
  studentId       String
  student         Student  @relation(fields: [studentId], references: [id])
  courseId         String
  course          Course   @relation(fields: [courseId], references: [id])
  startDate       DateTime
  daysOfWeek      String[] // e.g., ["MO","TU","WE","TH","FR"]
  lessonsPerDay   Int      @default(1)
  alternating     Boolean  @default(false)

  scheduledItems  ScheduledItem[]

  @@unique([studentId, courseId])
}

model ScheduledItem {
  id            String             @id @default(cuid())
  enrollmentId  String
  enrollment    Enrollment         @relation(fields: [enrollmentId], references: [id])
  lessonId      String
  date          DateTime
  status        ScheduledStatus    @default(UPCOMING)

  @@index([enrollmentId, date])
}

enum ScheduledStatus {
  UPCOMING
  COMPLETED
  SKIPPED
  RESCHEDULED
}

// ─── CALENDAR EVENTS ───────────────────────────────────────

model CalendarEvent {
  id          String   @id @default(cuid())
  familyId    String
  title       String
  date        DateTime
  allDay      Boolean  @default(true)
  eventType   String   // "vacation", "field_trip", "special", "day_off"
  notes       String?
}

// ─── GRADING SCALE ─────────────────────────────────────────

model GradingScale {
  id        String             @id @default(cuid())
  familyId  String             @unique
  entries   GradingScaleEntry[]
}

model GradingScaleEntry {
  id             String       @id @default(cuid())
  gradingScaleId String
  gradingScale   GradingScale @relation(fields: [gradingScaleId], references: [id])
  letter         String       // "A", "B+", etc.
  minPercent     Float
  maxPercent     Float
  gpaPoints      Float        // 4.0, 3.7, etc.
}
```

-----

## 7. Feature Specifications

### 7.1 Onboarding Flow

**Route:** `/onboarding`

The first-time experience after account creation. A step-by-step wizard:

1. **Welcome & Parent Profile** — Name, email (pre-filled), avatar upload, time zone, state (for reporting requirements).
1. **Add Students** — For each student: first name, last name, grade level, birth date, username, password. Toggle for “show gradebook to student.”
1. **Assign Courses** — Browse available course catalog or create a custom course. For each course assigned: select student, pick start date, choose days of the week, set lessons per day.
1. **Confirmation** — Summary of setup. “Start Homeschooling” button.

The schedule auto-populates for the full year based on the configuration. Parent can edit later.

-----

### 7.2 Parent Dashboard

**Route:** `/dashboard`

The command center. A student-selector dropdown at the top toggles whose data is displayed.

**Sections (customizable order via drag-and-drop):**

- **Day-at-a-Glance** — Today’s date, number of lessons due, number completed, number remaining.
- **Course Progress Overview** — Horizontal progress bars per course (e.g., “Math — 42% complete”).
- **Today’s Lessons** — List of lessons due today with course name, lesson title, and completion checkbox. Completed items show strikethrough.
- **Materials Needed** — Aggregated list of physical materials required for today’s lessons.
- **Upcoming Assignments** — Next 5 assignments due after today.
- **Recently Graded** — Last 5 graded assignments with scores.

-----

### 7.3 Student Dashboard

**Route:** `/student/dashboard`

Simplified, focused view:

- **Today’s Checklist** — Ordered list of today’s lessons. Each item shows: course icon/color, lesson title, type (video, reading, assignment), and a “Mark Complete” button. Clicking a video lesson opens the video player.
- **Course Progress** — Visual progress rings or bars per course.
- **Upcoming** — Next 3 days of scheduled lessons.

-----

### 7.4 Calendar

**Route:** `/calendar`

**Views:** Day, Week, Month (toggle).

**Displays:**

- Scheduled lessons (color-coded by course)
- Custom calendar events (vacations, field trips)
- Completed vs. upcoming vs. skipped items

**Actions from Calendar:**

- **Quick Schedule:** Click any lesson to mark complete, skip, or reschedule to another date.
- **Bulk Reschedule:** Select a date range and shift all items forward/backward by N days.
- **Add Day Off / Vacation:** Select dates, all scheduled items auto-reschedule to the next available day.
- **Add Special Event:** Title, date, optional notes.

-----

### 7.5 Courses

**Route:** `/courses` → `/courses/[courseId]`

**Course List View:**

- Cards showing: course thumbnail, title, subject, grade level, assigned student(s), progress percentage.
- Filter by student, subject, or status.

**Course Detail View:**

- **Assignment Schedule** — Full list of lessons in sequence order with dates, status, and type icons.
- **Resources** — Downloadable PDFs: teacher edition, student handouts, quiz files, answer keys.
- **Course Info** — Description, total lessons, estimated completion date.

-----

### 7.6 Assignments & Grading

**Route:** `/assignments`

**Grading Queue:** List of submitted (but ungraded) assignments across all students/courses.

For each assignment:

- Student name, course name, assignment title, type, max points.
- Point entry field (numeric input).
- Link to answer key PDF (opens in side panel or new tab).
- “Skip Grading” button (excluded from gradebook calculations).
- “Allow Retake” button (resets submission status).
- Quick navigation: Previous / Next assignment buttons.

**Auto-Grading (for quizzes/tests):**

- Multiple choice and true/false questions are auto-graded.
- Essay or map sections flagged for manual review.
- Score auto-populates; parent can override.

-----

### 7.7 Gradebook

**Route:** `/gradebook`

**Per-Student View (selected via dropdown):**

|Course   |Assignment Count|Graded|Average|Letter Grade|
|---------|----------------|------|-------|------------|
|Math 5   |45              |38    |92.4%  |A           |
|Science 5|30              |25    |88.1%  |B+          |

**Drill-Down (click a course):**

- Table of all assignments with: title, type, max points, points earned, percentage, date graded.
- Inline editing: click any grade cell to modify.
- Filter by assignment type (homework, quiz, test, etc.).

**Grading Scale Configuration:**

- Editable table of letter grades, percentage ranges, and GPA points.
- Default scale pre-populated (A = 93-100, A- = 90-92, B+ = 87-89, etc.).

-----

### 7.8 Reports & Transcripts

**Route:** `/reports`

Three report types, each exportable as PDF:

**7.8.1 Transcript**

- Student name, grade level, school year.
- Table: Course name, final grade (letter + percentage), credits earned, GPA points.
- Cumulative GPA at bottom.
- Parent signature line.

**7.8.2 Progress Report**

- Per-course breakdown: current grade, lessons completed vs. total, estimated completion date.
- Attendance/time tracking summary (if enabled).

**7.8.3 Course Grade Report**

- Single-course deep dive: every assignment, grade, and date.
- Summary statistics: average, highest, lowest, missing count.

-----

### 7.9 Custom Courses

**Route:** `/courses/create`

For non-platform curriculum or extracurriculars (Piano, Latin, AWANA, etc.):

- **Course Info:** Title, subject, grade level, description.
- **Template Selection:** Choose a template based on number of school days (e.g., 180-day, 90-day, custom).
- **Days of Week & Lessons Per Day.**
- **After creation:** Generic lessons populate (Lesson 1, Lesson 2…). Parent can edit each lesson title, add notes, and attach files.

-----

### 7.10 Video Lesson Player

**Route:** `/courses/[courseId]/lessons/[lessonId]`

- Embedded video player (HLS adaptive streaming).
- Progress tracking (resume where left off).
- Playback speed controls (0.5x, 1x, 1.25x, 1.5x, 2x).
- “Mark Complete” button below video.
- Sidebar: lesson materials list, related assignment links.
- Optional: time tracking (how long student watched).

-----

### 7.11 Online Assessments (Quizzes & Tests)

**Route:** `/assessments/[assignmentId]`

- Timed or untimed (configurable per assignment).
- Question types: multiple choice, true/false, short answer, essay.
- Auto-save progress.
- Submit button with confirmation dialog.
- Auto-grading for objective questions; manual review queue for subjective.
- Results screen: score, correct/incorrect per question (if parent enables review).

-----

### 7.12 Settings & Profile Management

**Parent Settings (`/settings`):**

- Family profile (name, address, state).
- Manage students (add, edit, remove, reorder).
- Per-student visibility toggles (show/hide gradebook, show/hide grade on dashboard).
- Grading scale configuration.
- Time zone and notification preferences.
- Account security (change password, 2FA).

**Student Settings (`/student/settings`):**

- Profile (avatar, display name).
- Change password.

-----

## 8. API Routes

Design as RESTful JSON APIs under `/api/v1/`.

```
Authentication:
  POST   /api/v1/auth/register
  POST   /api/v1/auth/login
  POST   /api/v1/auth/logout
  POST   /api/v1/auth/refresh
  GET    /api/v1/auth/me

Family:
  GET    /api/v1/family
  PUT    /api/v1/family

Students:
  GET    /api/v1/students
  POST   /api/v1/students
  GET    /api/v1/students/:id
  PUT    /api/v1/students/:id
  DELETE /api/v1/students/:id

Courses:
  GET    /api/v1/courses                    (catalog + custom)
  POST   /api/v1/courses                    (create custom course)
  GET    /api/v1/courses/:id
  PUT    /api/v1/courses/:id
  DELETE /api/v1/courses/:id
  GET    /api/v1/courses/:id/lessons
  GET    /api/v1/courses/:id/resources

Enrollments:
  POST   /api/v1/enrollments                (assign course to student)
  GET    /api/v1/enrollments?studentId=x
  DELETE /api/v1/enrollments/:id
  POST   /api/v1/enrollments/:id/generate-schedule

Schedule:
  GET    /api/v1/schedule?studentId=x&startDate=y&endDate=z
  PUT    /api/v1/schedule/:itemId            (mark complete, skip, reschedule)
  POST   /api/v1/schedule/bulk-reschedule
  POST   /api/v1/schedule/add-day-off

Assignments & Grading:
  GET    /api/v1/assignments?studentId=x&status=submitted
  GET    /api/v1/assignments/:id
  PUT    /api/v1/submissions/:id             (enter grade, skip, allow retake)

Gradebook:
  GET    /api/v1/gradebook?studentId=x
  GET    /api/v1/gradebook/:courseId?studentId=x
  PUT    /api/v1/grading-scale

Reports:
  GET    /api/v1/reports/transcript?studentId=x&year=2025
  GET    /api/v1/reports/progress?studentId=x
  GET    /api/v1/reports/course-grade?studentId=x&courseId=y

Calendar Events:
  GET    /api/v1/calendar-events?startDate=x&endDate=y
  POST   /api/v1/calendar-events
  PUT    /api/v1/calendar-events/:id
  DELETE /api/v1/calendar-events/:id

Dashboard:
  GET    /api/v1/dashboard?studentId=x       (aggregated dashboard data)
```

-----

## 9. UI/UX Design Guidelines

### Visual Style

- **Color palette:** Warm, inviting, family-friendly. Primary blue (#3B82F6), accent green (#10B981) for completed items, amber (#F59E0B) for upcoming, red (#EF4444) for overdue/missing.
- **Typography:** Inter or system font stack. Clean, highly readable.
- **Spacing:** Generous whitespace. Cards with rounded corners (8px). Subtle shadows.
- **Icons:** Lucide React icon set.

### Layout Principles

- Sidebar navigation (collapsible on mobile → bottom tab bar).
- Student selector always accessible in the top bar (parent view).
- Breadcrumb navigation on detail pages.
- Toast notifications for actions (grade saved, lesson completed, etc.).
- Skeleton loading states on all data-fetching pages.

### Mobile Responsiveness

- Sidebar collapses to hamburger menu below 768px.
- Calendar defaults to day/agenda view on mobile.
- Grade entry uses large touch targets.
- Video player goes full-width on mobile.

### Accessibility

- WCAG 2.1 AA compliance target.
- Keyboard navigable. Focus outlines.
- ARIA labels on interactive elements.
- Color is never the only indicator (always paired with icon or text).

-----

## 10. Implementation Phases

### Phase 1 — Foundation (MVP)

**Goal:** Core platform that a parent can use to manage one student’s school year.

- [ ] Project scaffolding (Next.js, Prisma, Tailwind, shadcn/ui)
- [ ] Database schema & migrations
- [ ] Authentication (register, login, role-based middleware)
- [ ] Onboarding wizard (parent profile, add student, assign course)
- [ ] Course catalog with seed data (5 sample courses, 10 lessons each)
- [ ] Schedule auto-generation engine
- [ ] Parent dashboard (day-at-a-glance, course progress, today’s lessons)
- [ ] Student dashboard (today’s checklist, mark complete)
- [ ] Calendar (month view, mark complete/skip from calendar)
- [ ] Basic gradebook (view grades, manual grade entry)

### Phase 2 — Grading & Scheduling Power

**Goal:** Full grading workflow and advanced scheduling.

- [ ] Assignment grading queue with answer key links
- [ ] Inline grade editing in gradebook
- [ ] Grading scale configuration
- [ ] Bulk reschedule tool
- [ ] Add day off / vacation scheduling
- [ ] Custom course creation
- [ ] Week and day calendar views
- [ ] Materials needed aggregation

### Phase 3 — Reporting & Assessments

**Goal:** Generate official documents and enable online tests.

- [ ] Transcript PDF generation
- [ ] Progress report PDF
- [ ] Course grade report PDF
- [ ] Online quiz/test builder (parent creates questions)
- [ ] Auto-grading engine for objective questions
- [ ] Assessment-taking interface for students

### Phase 4 — Media & Polish

**Goal:** Video delivery and production-ready polish.

- [ ] Video lesson player with HLS streaming
- [ ] Video progress tracking (resume playback)
- [ ] Playback speed controls
- [ ] Offline video download support (PWA or native wrapper)
- [ ] Resource file upload and management
- [ ] Drag-and-drop dashboard customization
- [ ] Notification system (overdue assignments, upcoming tests)
- [ ] Time tracking per lesson
- [ ] Dark mode
- [ ] Performance optimization & caching

-----

## 11. Seed Data Requirements

For development and demo purposes, Claude Code should generate seed data:

- **1 Parent account** — email: `parent@edunest.dev`, password: `password123`
- **2 Students** — “Emma” (Grade 5) and “Liam” (Grade 3)
- **6 Courses:** Math, Science, English, History, Bible, and Art — each with 20 lessons containing realistic titles.
- **Assignments:** 2-3 per lesson of varying types.
- **Sample grades:** ~60% of Emma’s assignments graded; ~40% of Liam’s.
- **Calendar events:** 2 vacation weeks, 3 field trip days.
- **Grading scale:** Standard A-F scale.

-----

## 12. Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/edunest

# Auth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# File Storage (S3-compatible)
S3_BUCKET=edunest-files
S3_REGION=us-east-1
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret
S3_ENDPOINT=http://localhost:9000  # MinIO for local dev

# Video (optional, Phase 4)
MUX_TOKEN_ID=your-mux-token
MUX_TOKEN_SECRET=your-mux-secret
```

-----

## 13. Testing Strategy

- **Unit tests:** Vitest for utility functions, schedule generation logic, GPA calculations.
- **Integration tests:** API route tests with test database.
- **E2E tests:** Playwright for critical flows — onboarding, assigning a course, grading an assignment, generating a transcript.
- **Target:** 80% coverage on business logic; E2E covers all Phase 1 user stories.

-----

## 14. Project Structure

```
edunest/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (parent)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── calendar/page.tsx
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [courseId]/page.tsx
│   │   │   │   └── create/page.tsx
│   │   │   ├── assignments/page.tsx
│   │   │   ├── gradebook/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [courseId]/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── students/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── onboarding/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (student)/
│   │   │   ├── student/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── courses/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [courseId]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── lessons/[lessonId]/page.tsx
│   │   │   │   ├── grades/page.tsx
│   │   │   │   ├── assessments/[assignmentId]/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/v1/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── family/route.ts
│   │   │   ├── students/route.ts
│   │   │   ├── courses/route.ts
│   │   │   ├── enrollments/route.ts
│   │   │   ├── schedule/route.ts
│   │   │   ├── assignments/route.ts
│   │   │   ├── submissions/route.ts
│   │   │   ├── gradebook/route.ts
│   │   │   ├── reports/route.ts
│   │   │   └── calendar-events/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx                    (landing / marketing page)
│   ├── components/
│   │   ├── ui/                         (shadcn primitives)
│   │   ├── dashboard/
│   │   ├── calendar/
│   │   ├── gradebook/
│   │   ├── courses/
│   │   ├── video-player/
│   │   ├── onboarding/
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── TopBar.tsx
│   │       ├── StudentSelector.tsx
│   │       └── MobileNav.tsx
│   ├── lib/
│   │   ├── prisma.ts                   (singleton client)
│   │   ├── auth.ts                     (NextAuth config)
│   │   ├── schedule-engine.ts          (auto-generate schedule from enrollment)
│   │   ├── gpa-calculator.ts
│   │   ├── pdf-generator.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useStudent.ts
│   │   ├── useDashboard.ts
│   │   └── useGradebook.ts
│   └── types/
│       └── index.ts
├── public/
│   └── images/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

-----

## 15. Key Business Logic

### 15.1 Schedule Generation Engine (`schedule-engine.ts`)

When a course is assigned to a student via an enrollment:

1. Read `startDate`, `daysOfWeek`, `lessonsPerDay`, and total lesson count from the course.
1. Starting from `startDate`, iterate forward through calendar days.
1. For each day that matches `daysOfWeek`, assign `lessonsPerDay` lessons in sequence.
1. Skip any dates that overlap with `CalendarEvent` entries of type “vacation” or “day_off.”
1. Create `ScheduledItem` records for each lesson-date pair.
1. Return the estimated end date.

### 15.2 GPA Calculation (`gpa-calculator.ts`)

- Per-course average = sum(pointsEarned) / sum(maxPoints) × 100. Skipped assignments excluded.
- Map percentage to letter grade and GPA points via the family’s `GradingScale`.
- Cumulative GPA = average of per-course GPA points (optionally weighted by credit hours).

### 15.3 Bulk Reschedule

When a parent adds a vacation or day off:

1. Identify all `ScheduledItem` records on affected dates.
1. Shift each item forward to the next valid school day (respecting `daysOfWeek`).
1. Cascade: shifted items may bump later items, so process in chronological order.
1. Update all affected `ScheduledItem.date` values.

-----

## 16. Non-Functional Requirements

|Requirement             |Target                                          |
|------------------------|------------------------------------------------|
|Page load time (initial)|< 3 seconds                                     |
|API response time       |< 500ms (p95)                                   |
|Uptime                  |99.5%                                           |
|Data backup             |Daily automated backups                         |
|Max concurrent users    |1,000 (initial target)                          |
|Browser support         |Last 2 versions of Chrome, Firefox, Safari, Edge|
|Accessibility           |WCAG 2.1 AA                                     |

-----

## 17. Out of Scope (v1)

These are explicitly **not** included in the initial build but noted for future consideration:

- Multi-family / co-op support
- Real-time chat or messaging between families
- Marketplace for third-party curriculum
- Native mobile apps (iOS/Android) — PWA only for v1
- AI-powered lesson recommendations
- Integration with third-party LMS platforms
- Payment processing / e-commerce
- Gamification (badges, streaks, points)

-----

## 18. Getting Started (for Claude Code)

```bash
# 1. Scaffold the project
npx create-next-app@latest edunest --typescript --tailwind --eslint --app --src-dir

# 2. Install core dependencies
cd edunest
npm install prisma @prisma/client next-auth@beta
npm install @tanstack/react-query zustand
npm install date-fns lucide-react
npm install -D vitest @playwright/test

# 3. Initialize shadcn/ui
npx shadcn@latest init

# 4. Initialize Prisma
npx prisma init

# 5. Copy the schema from Section 6 into prisma/schema.prisma

# 6. Run migrations
npx prisma migrate dev --name init

# 7. Seed the database
npx prisma db seed

# 8. Start development
npm run dev
```

**Claude Code should begin with Phase 1 and work through each checkbox sequentially.** Each feature should be committed as a logical unit with a descriptive commit message.

-----

*End of Document*
