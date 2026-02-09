interface GradingScaleEntry {
  letter: string;
  min_percent: number;
  max_percent: number;
  gpa_points: number;
}

interface SubmissionGrade {
  points_earned: number | null;
  max_points: number;
  status: string;
  skipped: boolean;
}

interface CourseGradeSummary {
  courseId: string;
  courseName: string;
  subject: string;
  totalAssignments: number;
  gradedAssignments: number;
  totalPointsEarned: number;
  totalMaxPoints: number;
  averagePercent: number;
  letterGrade: string;
  gpaPoints: number;
}

/**
 * Default A-F grading scale
 */
export const DEFAULT_GRADING_SCALE: GradingScaleEntry[] = [
  { letter: 'A+', min_percent: 97, max_percent: 100, gpa_points: 4.0 },
  { letter: 'A', min_percent: 93, max_percent: 96.99, gpa_points: 4.0 },
  { letter: 'A-', min_percent: 90, max_percent: 92.99, gpa_points: 3.7 },
  { letter: 'B+', min_percent: 87, max_percent: 89.99, gpa_points: 3.3 },
  { letter: 'B', min_percent: 83, max_percent: 86.99, gpa_points: 3.0 },
  { letter: 'B-', min_percent: 80, max_percent: 82.99, gpa_points: 2.7 },
  { letter: 'C+', min_percent: 77, max_percent: 79.99, gpa_points: 2.3 },
  { letter: 'C', min_percent: 73, max_percent: 76.99, gpa_points: 2.0 },
  { letter: 'C-', min_percent: 70, max_percent: 72.99, gpa_points: 1.7 },
  { letter: 'D+', min_percent: 67, max_percent: 69.99, gpa_points: 1.3 },
  { letter: 'D', min_percent: 63, max_percent: 66.99, gpa_points: 1.0 },
  { letter: 'D-', min_percent: 60, max_percent: 62.99, gpa_points: 0.7 },
  { letter: 'F', min_percent: 0, max_percent: 59.99, gpa_points: 0.0 },
];

/**
 * Calculate the average percentage from graded submissions.
 * Skipped assignments are excluded from calculation.
 */
export function calculateAveragePercent(submissions: SubmissionGrade[]): number {
  const graded = submissions.filter(
    (s) => s.status === 'GRADED' && !s.skipped && s.points_earned !== null
  );

  if (graded.length === 0) return 0;

  const totalEarned = graded.reduce((sum, s) => sum + (s.points_earned ?? 0), 0);
  const totalMax = graded.reduce((sum, s) => sum + s.max_points, 0);

  if (totalMax === 0) return 0;

  return (totalEarned / totalMax) * 100;
}

/**
 * Map a percentage to a letter grade using the grading scale.
 */
export function percentToLetterGrade(
  percent: number,
  scale: GradingScaleEntry[] = DEFAULT_GRADING_SCALE
): string {
  // Sort by min_percent descending so we find the highest matching bracket
  const sorted = [...scale].sort((a, b) => b.min_percent - a.min_percent);

  for (const entry of sorted) {
    if (percent >= entry.min_percent && percent <= entry.max_percent) {
      return entry.letter;
    }
  }

  // Fallback: if percent > 100, return highest; if < 0, return lowest
  if (percent >= 100) return sorted[0]?.letter ?? 'A+';
  return sorted[sorted.length - 1]?.letter ?? 'F';
}

/**
 * Map a percentage to GPA points using the grading scale.
 */
export function percentToGpaPoints(
  percent: number,
  scale: GradingScaleEntry[] = DEFAULT_GRADING_SCALE
): number {
  const sorted = [...scale].sort((a, b) => b.min_percent - a.min_percent);

  for (const entry of sorted) {
    if (percent >= entry.min_percent && percent <= entry.max_percent) {
      return entry.gpa_points;
    }
  }

  if (percent >= 100) return sorted[0]?.gpa_points ?? 4.0;
  return sorted[sorted.length - 1]?.gpa_points ?? 0.0;
}

/**
 * Calculate per-course grade summary for a student.
 */
export function calculateCourseGrade(
  courseId: string,
  courseName: string,
  subject: string,
  submissions: SubmissionGrade[],
  scale: GradingScaleEntry[] = DEFAULT_GRADING_SCALE
): CourseGradeSummary {
  const graded = submissions.filter(
    (s) => s.status === 'GRADED' && !s.skipped && s.points_earned !== null
  );

  const totalPointsEarned = graded.reduce((sum, s) => sum + (s.points_earned ?? 0), 0);
  const totalMaxPoints = graded.reduce((sum, s) => sum + s.max_points, 0);
  const averagePercent = totalMaxPoints > 0 ? (totalPointsEarned / totalMaxPoints) * 100 : 0;

  return {
    courseId,
    courseName,
    subject,
    totalAssignments: submissions.length,
    gradedAssignments: graded.length,
    totalPointsEarned,
    totalMaxPoints,
    averagePercent: Math.round(averagePercent * 100) / 100,
    letterGrade: percentToLetterGrade(averagePercent, scale),
    gpaPoints: percentToGpaPoints(averagePercent, scale),
  };
}

/**
 * Calculate cumulative GPA across all courses.
 * Simple average of per-course GPA points (unweighted).
 */
export function calculateCumulativeGPA(courseSummaries: CourseGradeSummary[]): number {
  const withGrades = courseSummaries.filter((c) => c.gradedAssignments > 0);

  if (withGrades.length === 0) return 0;

  const totalGpaPoints = withGrades.reduce((sum, c) => sum + c.gpaPoints, 0);
  return Math.round((totalGpaPoints / withGrades.length) * 100) / 100;
}
