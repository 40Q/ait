import { format } from "date-fns";

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
