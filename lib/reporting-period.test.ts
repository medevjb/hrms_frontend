import { describe, expect, it } from "vitest";
import {
  periodContains,
  periodFromKey,
  resolvePeriod,
  stepPeriod,
} from "./reporting-period";

/**
 * Mirrors the backend table in
 * `tests/Unit/Services/ReportingPeriodServiceTest.php` — the two resolvers
 * must agree byte-for-byte.
 */
describe("resolvePeriod", () => {
  it("puts a date after the cutoff in the period ending next month", () => {
    expect(resolvePeriod("2026-08-26", 25)).toEqual({
      key: "2026-09",
      label: "September 2026",
      startDate: "2026-08-26",
      endDate: "2026-09-25",
    });
  });

  it("puts a date on or before the cutoff in the period ending this month", () => {
    expect(resolvePeriod("2026-09-25", 25).key).toBe("2026-09");
    expect(resolvePeriod("2026-09-10", 25).key).toBe("2026-09");
    expect(resolvePeriod("2026-09-01", 25).startDate).toBe("2026-08-26");
  });

  it("resolves a null cutoff to the calendar month", () => {
    expect(resolvePeriod("2026-09-10", null)).toEqual({
      key: "2026-09",
      label: "September 2026",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    });
  });

  it("treats a zero or negative cutoff as null", () => {
    expect(resolvePeriod("2026-09-10", 0).startDate).toBe("2026-09-01");
    expect(resolvePeriod("2026-09-10", -3).startDate).toBe("2026-09-01");
  });

  it("clamps a cutoff above 28", () => {
    expect(resolvePeriod("2026-09-10", 31).endDate).toBe("2026-09-28");
  });
});

describe("periodFromKey", () => {
  it("keeps consecutive periods contiguous with no gap or overlap", () => {
    let previousEnd: string | null = null;
    for (const key of ["2026-01", "2026-02", "2026-03", "2026-04"]) {
      const period = periodFromKey(key, 28);
      if (previousEnd !== null) {
        const dayAfter = new Date(`${previousEnd}T00:00:00Z`);
        dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
        expect(period.startDate).toBe(dayAfter.toISOString().slice(0, 10));
      }
      previousEnd = period.endDate;
    }
  });

  it("does not orphan the leap day when the cutoff is 28", () => {
    expect(periodFromKey("2028-03", 28).startDate).toBe("2028-02-29");
  });

  it("falls back to the current period for an unparseable key", () => {
    expect(periodFromKey("nonsense", 25, "2026-09-10").key).toBe("2026-09");
  });
});

describe("stepPeriod", () => {
  it("moves to the adjacent period and relabels it", () => {
    const september = periodFromKey("2026-09", 25);
    expect(stepPeriod(september, -1, 25)).toEqual({
      key: "2026-08",
      label: "August 2026",
      startDate: "2026-07-26",
      endDate: "2026-08-25",
    });
    expect(stepPeriod(september, 1, 25).startDate).toBe("2026-09-26");
  });
});

describe("periodContains", () => {
  it("is inclusive of both boundaries", () => {
    const period = periodFromKey("2026-09", 25);
    expect(periodContains(period, "2026-08-26")).toBe(true);
    expect(periodContains(period, "2026-09-25")).toBe(true);
    expect(periodContains(period, "2026-08-25")).toBe(false);
    expect(periodContains(period, "2026-09-26")).toBe(false);
  });
});
