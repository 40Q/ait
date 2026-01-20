import { format } from "date-fns";

// Calendar constants
export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

/**
 * Format a date string or Date object to a readable format
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "PPP"); // "January 15, 2025"
}

/**
 * Format a date with time
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "PPP 'at' p"); // "January 15, 2025 at 3:30 PM"
}

/**
 * Format a date in short format
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy"); // "Jan 15, 2025"
}

/**
 * Format a date with time in short format
 */
export function formatDateTimeShort(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, h:mm a"); // "Jan 15, 3:30 PM"
}

// Calendar utilities

/**
 * Get the first day of a month in ISO format (YYYY-MM-DD)
 */
export function getMonthStart(year: number, month: number): string {
  return new Date(year, month, 1).toISOString().split("T")[0];
}

/**
 * Get the last day of a month in ISO format (YYYY-MM-DD)
 */
export function getMonthEnd(year: number, month: number): string {
  return new Date(year, month + 1, 0).toISOString().split("T")[0];
}

/**
 * Get all days to display in a calendar month view,
 * including padding days from previous and next months
 */
export function getCalendarDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add days from previous month to fill the first week
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Add all days of the current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Add days from next month to complete the last week
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
  }

  return days;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Get date key in ISO format (YYYY-MM-DD) for a Date object
 */
export function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}
