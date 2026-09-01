import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  format,
  differenceInMonths,
  differenceInDays,
  differenceInYears,
  isValid,
  parseISO,
} from "date-fns";
import type { CalendarDayItem, CalendarDayStatus } from "./mockData";

/**
 * Length of service from a joining date, e.g. "1 year 4 months" or
 * "10 months 26 days". Returns null when there's no usable date so the
 * caller can render its own empty state rather than a fabricated span.
 */
export function calculateLengthOfService(joiningDateStr?: string | null): string | null {
  if (!joiningDateStr) return null;

  const joining = parseISO(joiningDateStr);
  if (!isValid(joining)) return null;

  const now = new Date();
  if (joining > now) return "Newly joined";

  const years = differenceInYears(now, joining);
  const months = differenceInMonths(now, joining) % 12;
  const days = Math.floor(differenceInDays(now, joining) % 30.4375);

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);

  return parts.join(" ");
}

/** A day's attendance record as the calendar needs it — times pre-formatted
 *  for display by the caller (the generator does no timezone work). */
export type CalendarRecord = {
  work_date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  worked_hours: string | null;
  late_minutes: number | null;
  shift_name: string | null;
};

const STATUS_MAP: Record<string, CalendarDayStatus> = {
  PRESENT: "PRESENT",
  LATE: "LATE",
  ABSENT: "ABSENT",
  ON_LEAVE: "LEAVE",
  HALF_DAY: "HALF_DAY",
  WEEKEND: "OFF",
  HOLIDAY: "HOLIDAY",
  MISSING_CHECKOUT: "PRESENT",
};

function labelFor(status: CalendarDayStatus): string | undefined {
  switch (status) {
    case "PRESENT":
      return "Present";
    case "LATE":
      return "Late";
    case "ABSENT":
      return "Absent";
    case "LEAVE":
      return "Leave";
    case "HALF_DAY":
      return "Half day";
    case "HOLIDAY":
      return "Holiday";
    case "OFF":
      return "(Off)";
    default:
      return undefined;
  }
}

/**
 * Builds the month grid from real attendance records and holidays only.
 * A past work day with no record is `NO_RECORD` (never an invented Present
 * or Absent); future days are `FUTURE`; weekends with no record fall back
 * to `OFF`. Stats are counted from what's actually there.
 *
 * `todayKey` is the organization's current date (`YYYY-MM-DD`), resolved
 * server-side in the org timezone — never the browser's clock, which can
 * disagree by a day and hide a day the employee has already worked. When
 * absent (payload still loading) it falls back to the browser date.
 */
const WEEKDAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function generateMonthCalendarDays(
  currentDate: Date,
  records?: CalendarRecord[],
  holidays?: Array<{ date: string; title: string }>,
  weekendDays?: string[],
  joiningDate?: string | null,
  todayKey: string = format(new Date(), "yyyy-MM-dd"),
): {
  days: CalendarDayItem[];
  stats: {
    workingDays: number;
    present: number;
    late: number;
    leave: number;
    absent: number;
    holiday: number;
    off: number;
    noRecord: number;
  };
} {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const allDates = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const recordMap = new Map<string, CalendarRecord>();
  for (const record of records ?? []) {
    recordMap.set(record.work_date, record);
  }

  const holidayMap = new Map<string, string>();
  for (const holiday of holidays ?? []) {
    holidayMap.set(holiday.date, holiday.title);
  }

  // The employee's effective weekly-off days (from me.weekend_days).
  // Fall back to Sat/Sun only until the payload arrives.
  const weekendSet = new Set(
    (weekendDays && weekendDays.length > 0 ? weekendDays : ["saturday", "sunday"]).map((d) =>
      d.toLowerCase(),
    ),
  );

  const days: CalendarDayItem[] = [];
  const stats = {
    workingDays: 0,
    present: 0,
    late: 0,
    leave: 0,
    absent: 0,
    holiday: 0,
    off: 0,
    noRecord: 0,
  };

  // Days before the employee joined aren't part of their record at all.
  const joined = joiningDate ? parseISO(joiningDate) : null;

  for (const date of allDates) {
    const isCurMonth = isSameMonth(date, monthStart);
    const dateKey = format(date, "yyyy-MM-dd");
    const dayNumber = date.getDate();
    const dayOfWeek = date.getDay();
    const isWeekend = weekendSet.has(WEEKDAY_NAMES[dayOfWeek]);
    const isPreHire = joined != null && isValid(joined) && dateKey < format(joined, "yyyy-MM-dd");

    const record = recordMap.get(dateKey);
    const holidayTitle = holidayMap.get(dateKey);

    let status: CalendarDayStatus;
    let checkIn: string | null = null;
    let checkOut: string | null = null;
    let workedHours: string | null = null;
    let lateMinutes: number | null = null;
    let note: string | undefined;
    let shiftName: string | undefined;

    if (isPreHire && !record) {
      status = "PRE_HIRE";
    } else if (record) {
      status = STATUS_MAP[record.status] ?? "NO_RECORD";
      checkIn = record.check_in;
      checkOut = record.check_out;
      workedHours = record.worked_hours;
      lateMinutes = record.late_minutes;
      shiftName = record.shift_name ?? undefined;
    } else if (holidayTitle) {
      status = "HOLIDAY";
      note = holidayTitle;
    } else if (isWeekend) {
      status = "OFF";
    } else if (dateKey > todayKey) {
      status = "FUTURE";
    } else {
      status = "NO_RECORD";
    }

    if (isCurMonth && status !== "PRE_HIRE") {
      if (!isWeekend && status !== "HOLIDAY") stats.workingDays++;
      if (status === "PRESENT") stats.present++;
      else if (status === "LATE") stats.late++;
      else if (status === "LEAVE") stats.leave++;
      else if (status === "ABSENT") stats.absent++;
      else if (status === "HOLIDAY") stats.holiday++;
      else if (status === "OFF") stats.off++;
      else if (status === "NO_RECORD") stats.noRecord++;
    }

    days.push({
      day: dayNumber,
      date: dateKey,
      dayOfWeek,
      status,
      statusLabel: note ? "Holiday" : labelFor(status),
      checkIn,
      checkOut,
      workedHours,
      lateMinutes,
      shiftName,
      note,
      isCurrentMonth: isCurMonth,
      isToday: dateKey === todayKey,
    });
  }

  return { days, stats };
}
