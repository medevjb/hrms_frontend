import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  intervalToDuration,
  isValid,
  parseISO,
} from "date-fns";

/** "NOTICE_PERIOD" → "Notice period" */
export function humanize(value: string): string {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getInitials(name: string): string {
  if (!name) return "EM";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function fmtDate(value: string | null, pattern = "d MMM yyyy"): string {
  if (!value) return "—";
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, pattern) : value;
}

/** Length of service, phrased the way HR references it. */
export function tenure(joiningDate: string): { headline: string; caption: string } {
  const start = parseISO(joiningDate);
  if (!isValid(start)) return { headline: "—", caption: "" };
  const months = Math.max(0, differenceInCalendarMonths(new Date(), start));
  const years = Math.floor(months / 12);
  const rest = months % 12;

  let headline = "New this month";
  if (months >= 1 && years === 0) headline = `${rest} mo`;
  else if (years >= 1 && rest === 0) headline = `${years} yr`;
  else if (years >= 1) headline = `${years} yr ${rest} mo`;

  return { headline, caption: `Joined ${format(start, "MMM yyyy")}` };
}

/**
 * A full years / months / days breakdown of length of service, plus the
 * running day count — "how long have I worked here" spelled out.
 */
export function tenureDetail(joiningDate: string): {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  since: string;
} | null {
  const start = parseISO(joiningDate);
  if (!isValid(start)) return null;

  const now = new Date();
  if (start > now) {
    return { years: 0, months: 0, days: 0, totalDays: 0, since: format(start, "d MMM yyyy") };
  }

  const duration = intervalToDuration({ start, end: now });

  return {
    years: duration.years ?? 0,
    months: duration.months ?? 0,
    days: duration.days ?? 0,
    totalDays: Math.max(0, differenceInCalendarDays(now, start)),
    since: format(start, "d MMM yyyy"),
  };
}
