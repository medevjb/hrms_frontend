import { differenceInCalendarMonths, format, isValid, parseISO } from "date-fns";

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
