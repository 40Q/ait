/**
 * Parse a comma-separated string of AP emails into a trimmed array.
 * Filters out empty strings that result from extra commas or whitespace.
 */
export function parseApEmails(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/**
 * Join an array of emails back into a comma-separated string.
 */
export function joinApEmails(emails: string[]): string {
  return emails.join(", ");
}
