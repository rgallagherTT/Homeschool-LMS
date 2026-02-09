/**
 * PDF generation utilities for EduNest reports.
 * Uses server-side rendering to generate PDF buffers.
 *
 * For actual PDF rendering, we use @react-pdf/renderer on the server
 * or return structured data for client-side rendering.
 */

interface TranscriptData {
  student: {
    firstName: string;
    lastName: string;
    gradeLevel: string;
  };
  schoolYear: string;
  familyName: string;
  courses: {
    name: string;
    subject: string;
    finalGradePercent: number;
    letterGrade: string;
    credits: number;
    gpaPoints: number;
  }[];
  cumulativeGPA: number;
  generatedAt: string;
}

interface ProgressReportData {
  student: {
    firstName: string;
    lastName: string;
    gradeLevel: string;
  };
  reportDate: string;
  courses: {
    name: string;
    subject: string;
    currentGradePercent: number;
    letterGrade: string;
    lessonsCompleted: number;
    totalLessons: number;
    estimatedCompletion: string | null;
  }[];
}

interface CourseGradeReportData {
  student: {
    firstName: string;
    lastName: string;
  };
  course: {
    name: string;
    subject: string;
  };
  assignments: {
    title: string;
    type: string;
    maxPoints: number;
    pointsEarned: number | null;
    percent: number | null;
    gradedAt: string | null;
    status: string;
  }[];
  summary: {
    averagePercent: number;
    letterGrade: string;
    highestPercent: number;
    lowestPercent: number;
    missingCount: number;
    totalAssignments: number;
    gradedCount: number;
  };
}

/**
 * Generate transcript data structure for PDF rendering.
 */
export function buildTranscriptData(
  student: { firstName: string; lastName: string; gradeLevel: string },
  familyName: string,
  schoolYear: string,
  courses: {
    name: string;
    subject: string;
    finalGradePercent: number;
    letterGrade: string;
    gpaPoints: number;
  }[],
  cumulativeGPA: number
): TranscriptData {
  return {
    student,
    schoolYear,
    familyName,
    courses: courses.map((c) => ({
      ...c,
      credits: 1.0, // Default 1 credit per course
    })),
    cumulativeGPA,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate progress report data structure.
 */
export function buildProgressReportData(
  student: { firstName: string; lastName: string; gradeLevel: string },
  courses: {
    name: string;
    subject: string;
    currentGradePercent: number;
    letterGrade: string;
    lessonsCompleted: number;
    totalLessons: number;
    estimatedCompletion: string | null;
  }[]
): ProgressReportData {
  return {
    student,
    reportDate: new Date().toISOString().split('T')[0],
    courses,
  };
}

/**
 * Generate course grade report data structure.
 */
export function buildCourseGradeReportData(
  student: { firstName: string; lastName: string },
  course: { name: string; subject: string },
  assignments: {
    title: string;
    type: string;
    maxPoints: number;
    pointsEarned: number | null;
    gradedAt: string | null;
    status: string;
  }[]
): CourseGradeReportData {
  const graded = assignments.filter(
    (a) => a.status === 'GRADED' && a.pointsEarned !== null
  );

  const percents = graded.map((a) => (a.pointsEarned! / a.maxPoints) * 100);

  const totalEarned = graded.reduce((sum, a) => sum + (a.pointsEarned ?? 0), 0);
  const totalMax = graded.reduce((sum, a) => sum + a.maxPoints, 0);
  const averagePercent = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;

  const missingCount = assignments.filter(
    (a) => a.status === 'NOT_STARTED' || a.status === 'SUBMITTED'
  ).length;

  return {
    student,
    course,
    assignments: assignments.map((a) => ({
      ...a,
      percent: a.pointsEarned !== null ? (a.pointsEarned / a.maxPoints) * 100 : null,
    })),
    summary: {
      averagePercent: Math.round(averagePercent * 100) / 100,
      letterGrade: getLetterGrade(averagePercent),
      highestPercent: percents.length > 0 ? Math.max(...percents) : 0,
      lowestPercent: percents.length > 0 ? Math.min(...percents) : 0,
      missingCount,
      totalAssignments: assignments.length,
      gradedCount: graded.length,
    },
  };
}

/**
 * Simple letter grade lookup (used internally).
 * For full grading scale support, use gpa-calculator.ts.
 */
function getLetterGrade(percent: number): string {
  if (percent >= 93) return 'A';
  if (percent >= 90) return 'A-';
  if (percent >= 87) return 'B+';
  if (percent >= 83) return 'B';
  if (percent >= 80) return 'B-';
  if (percent >= 77) return 'C+';
  if (percent >= 73) return 'C';
  if (percent >= 70) return 'C-';
  if (percent >= 67) return 'D+';
  if (percent >= 63) return 'D';
  if (percent >= 60) return 'D-';
  return 'F';
}

export type { TranscriptData, ProgressReportData, CourseGradeReportData };
