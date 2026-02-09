import { addDays, isAfter, isBefore, isSameDay, getDay } from 'date-fns';

const DAY_MAP: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

interface ScheduleConfig {
  startDate: Date;
  daysOfWeek: string[]; // e.g., ["MO", "TU", "WE", "TH", "FR"]
  lessonsPerDay: number;
  lessonIds: string[]; // ordered list of lesson IDs
  blackoutDates: Date[]; // vacation/day-off dates to skip
}

interface ScheduledItemInput {
  enrollment_id: string;
  lesson_id: string;
  date: string; // ISO date string YYYY-MM-DD
  status: string;
}

/**
 * Generates a schedule of lesson-date pairs based on enrollment configuration.
 *
 * Algorithm:
 * 1. Start from startDate, iterate forward through calendar days.
 * 2. For each day matching daysOfWeek, assign lessonsPerDay lessons in sequence.
 * 3. Skip dates overlapping with blackoutDates (vacation/day_off).
 * 4. Continue until all lessons are scheduled.
 */
export function generateSchedule(
  enrollmentId: string,
  config: ScheduleConfig
): ScheduledItemInput[] {
  const { startDate, daysOfWeek, lessonsPerDay, lessonIds, blackoutDates } = config;

  const allowedDays = new Set(daysOfWeek.map((d) => DAY_MAP[d]));
  const blackoutSet = new Set(blackoutDates.map((d) => d.toISOString().split('T')[0]));

  const items: ScheduledItemInput[] = [];
  let lessonIndex = 0;
  let currentDate = new Date(startDate);

  // Safety limit: don't iterate more than 400 days
  const maxDate = addDays(startDate, 400);

  while (lessonIndex < lessonIds.length && isBefore(currentDate, maxDate)) {
    const dayOfWeek = getDay(currentDate);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Check if this day is a valid school day and not a blackout date
    if (allowedDays.has(dayOfWeek) && !blackoutSet.has(dateStr)) {
      // Assign lessonsPerDay lessons to this date
      for (let i = 0; i < lessonsPerDay && lessonIndex < lessonIds.length; i++) {
        items.push({
          enrollment_id: enrollmentId,
          lesson_id: lessonIds[lessonIndex],
          date: dateStr,
          status: 'UPCOMING',
        });
        lessonIndex++;
      }
    }

    currentDate = addDays(currentDate, 1);
  }

  return items;
}

/**
 * Reschedules items forward when a vacation/day-off is added.
 *
 * Takes all scheduled items on the affected dates and shifts them
 * to the next available school days, cascading as needed.
 */
export function bulkReschedule(
  items: { id: string; date: string }[],
  affectedDates: string[],
  daysOfWeek: string[],
  existingBlackoutDates: string[]
): { id: string; newDate: string }[] {
  const allowedDays = new Set(daysOfWeek.map((d) => DAY_MAP[d]));
  const blackoutSet = new Set([...existingBlackoutDates, ...affectedDates]);

  // Sort items by date
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));

  // Find items on affected dates
  const affectedSet = new Set(affectedDates);
  const toReschedule = sorted.filter((item) => affectedSet.has(item.date));

  if (toReschedule.length === 0) return [];

  const updates: { id: string; newDate: string }[] = [];

  // All occupied dates (including non-affected items)
  const occupiedDates = new Map<string, number>();
  for (const item of sorted) {
    if (!affectedSet.has(item.date)) {
      occupiedDates.set(item.date, (occupiedDates.get(item.date) || 0) + 1);
    }
  }

  for (const item of toReschedule) {
    // Find next available date after the item's current date
    let candidate = addDays(new Date(item.date), 1);
    const maxDate = addDays(candidate, 400);

    while (isBefore(candidate, maxDate)) {
      const dateStr = candidate.toISOString().split('T')[0];
      const dayOfWeek = getDay(candidate);

      if (allowedDays.has(dayOfWeek) && !blackoutSet.has(dateStr)) {
        updates.push({ id: item.id, newDate: dateStr });
        occupiedDates.set(dateStr, (occupiedDates.get(dateStr) || 0) + 1);
        break;
      }
      candidate = addDays(candidate, 1);
    }
  }

  return updates;
}

/**
 * Find the next valid school date from a given date.
 */
export function findNextSchoolDate(
  fromDate: Date,
  daysOfWeek: string[],
  blackoutDates: string[]
): Date {
  const allowedDays = new Set(daysOfWeek.map((d) => DAY_MAP[d]));
  const blackoutSet = new Set(blackoutDates);

  let candidate = addDays(fromDate, 1);
  const maxDate = addDays(fromDate, 400);

  while (isBefore(candidate, maxDate)) {
    const dateStr = candidate.toISOString().split('T')[0];
    const dayOfWeek = getDay(candidate);

    if (allowedDays.has(dayOfWeek) && !blackoutSet.has(dateStr)) {
      return candidate;
    }
    candidate = addDays(candidate, 1);
  }

  return candidate;
}
