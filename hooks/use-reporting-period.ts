"use client";

import { useCallback, useMemo, useState } from "react";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import {
  type ReportingPeriod,
  periodContains,
  periodFromKey,
  resolvePeriod,
  stepPeriod,
} from "@/lib/reporting-period";

type UseReportingPeriod = {
  /** The period currently in view (the current one until the user steps). */
  period: ReportingPeriod;
  /** The org reporting cutoff (null → calendar months). */
  cutoff: number | null;
  /** The current period, from the org clock — never changes as you step. */
  current: ReportingPeriod;
  isCurrent: boolean;
  goPrev: () => void;
  goNext: () => void;
  goToCurrent: () => void;
  goToKey: (key: string) => void;
  contains: (dateISO: string) => boolean;
};

/**
 * The organization's custom reporting month (docs/PRD.md §85), plus
 * navigation. The current period is resolved server-side and rides on the
 * session (`user.organization.reporting_period`); stepping to other
 * periods is done client-side with the same resolver the backend uses.
 *
 * `initialKey` selects the period to open on (defaults to the current one).
 */
export function useReportingPeriod(initialKey?: string): UseReportingPeriod {
  const { organization } = useCurrentUser();
  const cutoff = organization.reporting_month_cutoff_day;

  const current = useMemo<ReportingPeriod>(() => {
    const payload = organization.reporting_period;
    return {
      key: payload.key,
      label: payload.label,
      startDate: payload.start_date,
      endDate: payload.end_date,
    };
  }, [organization.reporting_period]);

  const [selectedKey, setSelectedKey] = useState<string | null>(initialKey ?? null);

  const period = useMemo<ReportingPeriod>(() => {
    if (selectedKey === null || selectedKey === current.key) return current;
    return periodFromKey(selectedKey, cutoff, current.startDate);
  }, [selectedKey, current, cutoff]);

  const goToKey = useCallback((key: string) => setSelectedKey(key), []);
  const goToCurrent = useCallback(() => setSelectedKey(null), []);
  const goPrev = useCallback(
    () => setSelectedKey(stepPeriod(period, -1, cutoff).key),
    [period, cutoff],
  );
  const goNext = useCallback(
    () => setSelectedKey(stepPeriod(period, 1, cutoff).key),
    [period, cutoff],
  );

  const contains = useCallback(
    (dateISO: string) => periodContains(period, dateISO),
    [period],
  );

  return {
    period,
    cutoff,
    current,
    isCurrent: period.key === current.key,
    goPrev,
    goNext,
    goToCurrent,
    goToKey,
    contains,
  };
}

/** Standalone resolver for code outside a React tree / one-off lookups. */
export { resolvePeriod };
