/**
 * Week date utilities for meal planning
 * Ensures consistent week boundaries (Monday start) across client and server
 */

/**
 * Get the Monday (start of week) for a given date at UTC midnight
 * This normalizes dates so we can use them as unique keys in the database
 */
export function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  // Convert Sunday (0) to 7 for calculation, Monday = 1
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Convert Date to ISO date-only string (YYYY-MM-DD)
 * Used for database storage and query parameters
 */
export function toISODateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get day index from day name (0 = Monday, 6 = Sunday)
 */
export function dayIndexFromName(
  dayName: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun" | string,
): number {
  const map: Record<string, number> = {
    Mon: 0,
    Monday: 0,
    Tue: 1,
    Tuesday: 1,
    Wed: 2,
    Wednesday: 2,
    Thu: 3,
    Thursday: 3,
    Fri: 4,
    Friday: 4,
    Sat: 5,
    Saturday: 5,
    Sun: 6,
    Sunday: 6,
  };
  return map[dayName] ?? 0;
}

/**
 * Get day name from index (0 = Monday, 6 = Sunday)
 */
export function dayNameFromIndex(
  index: number,
): "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun" {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  return names[index % 7];
}

/**
 * Get the current week's start date as YYYY-MM-DD (this Monday at UTC midnight)
 */
export function getCurrentWeekStart(): string {
  return toISODateOnly(getWeekStartDate(new Date()));
}
