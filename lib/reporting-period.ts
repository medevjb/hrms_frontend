import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isValid,
  parse,
  parseISO,
  setDate,
  startOfMonth,
  subMonths,
} from "date-fns";

/**
 * The organization's custom reporting month (see backend
 * `ReportingPeriodService` / PRD §85). Mirrors that resolver exactly — the
 * backend echoes the current period on the org-settings payload; this is
 * for stepping to other periods client-side.
 *
 * With a null cutoff a period is just the calendar month. With cutoff `C`,
 * reporting month *M* runs from day `C+1` of *M-1* through day `C` of *M*,
 * and is always keyed (`YYYY-MM`) and labelled by the month it ends in
 * (cutoff 25 → the window ending 25 Sep is "September 2026").
 */
export type ReportingPeriod = {
  key: string;
  label: string;
  /** `YYYY-MM-DD`, inclusive. */
  startDate: string;
  /** `YYYY-MM-DD`, inclusive. */
  endDate: string;
};

/** Every month has at least 28 days, so this is the highest safe cutoff. */
const MAX_CUTOFF = 28;

const ISO_DATE = "yyyy-MM-dd";
const KEY_FORMAT = "yyyy-MM";

function normaliseCutoff(cutoff: number | null | undefined): number | null {
  if (cutoff == null || cutoff <= 0) return null;
  return Math.min(cutoff, MAX_CUTOFF);
}

function build(start: Date, end: Date): ReportingPeriod {
  return {
    key: format(end, KEY_FORMAT),
    label: format(end, "MMMM yyyy"),
    startDate: format(start, ISO_DATE),
    endDate: format(end, ISO_DATE),
  };
}

/** The period containing `referenceISO` (`YYYY-MM-DD` or full ISO). */
export function resolvePeriod(
  referenceISO: string,
  cutoff: number | null | undefined,
): ReportingPeriod {
  const reference = parseISO(referenceISO);
  const normalised = normaliseCutoff(cutoff);

  if (normalised === null) {
    return build(startOfMonth(reference), endOfMonth(reference));
  }

  const endMonthAnchor =
    reference.getDate() <= normalised ? reference : addMonths(reference, 1);
  const end = setDate(endMonthAnchor, normalised);
  const start = addDays(subMonths(end, 1), 1);

  return build(start, end);
}

/**
 * The period identified by a `YYYY-MM` key (the month it ends in).
 * An unparseable key falls back to the period containing `fallbackISO`
 * (defaults to today).
 */
export function periodFromKey(
  key: string,
  cutoff: number | null | undefined,
  fallbackISO: string = format(new Date(), ISO_DATE),
): ReportingPeriod {
  const normalised = normaliseCutoff(cutoff);
  const endMonth = parse(key, KEY_FORMAT, new Date());

  if (!isValid(endMonth)) {
    return resolvePeriod(fallbackISO, normalised);
  }

  const reference =
    normalised === null ? startOfMonth(endMonth) : setDate(endMonth, normalised);

  return resolvePeriod(format(reference, ISO_DATE), normalised);
}

/** The period `delta` months before (negative) or after (positive) `period`. */
export function stepPeriod(
  period: ReportingPeriod,
  delta: number,
  cutoff: number | null | undefined,
): ReportingPeriod {
  const shiftedKey = format(
    addMonths(parse(period.key, KEY_FORMAT, new Date()), delta),
    KEY_FORMAT,
  );
  return periodFromKey(shiftedKey, cutoff);
}

/** Is `dateISO` (`YYYY-MM-DD`) inside `period` (inclusive)? */
export function periodContains(period: ReportingPeriod, dateISO: string): boolean {
  return dateISO >= period.startDate && dateISO <= period.endDate;
}
