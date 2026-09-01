import { eachDayOfInterval, format, parseISO } from "date-fns";

/**
 * Every `yyyy-MM-dd` a date range covers, inclusive. A backwards range
 * (end before start) collapses to just the start day.
 */
export function datesInRange(startISO: string, endISO: string): string[] {
  const start = parseISO(startISO);
  const end = parseISO(endISO);

  if (end < start) {
    return [format(start, "yyyy-MM-dd")];
  }

  return eachDayOfInterval({ start, end }).map((day) => format(day, "yyyy-MM-dd"));
}
