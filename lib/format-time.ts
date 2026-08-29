/**
 * §142 — the organization timezone is authoritative for display, not just
 * evaluation. A JS Date is always a UTC instant; Intl.DateTimeFormat's
 * timeZone option projects it for display without needing the instant
 * itself to be constructed any differently.
 */
export function formatTimeInTimezone(date: string | Date, timezone: string): string {
  const instant = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(instant);
}
