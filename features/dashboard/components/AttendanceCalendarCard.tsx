"use client";

import { useState, useMemo } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportingPeriod } from "@/lib/reporting-period";
import { generateMonthCalendarDays, type CalendarRecord } from "../utils";
import type { CalendarDayItem } from "../mockData";
import { DayDetailsModal } from "./DayDetailsModal";

type Props = {
  /** The reporting period in view (docs/PRD.md §85). */
  period: ReportingPeriod;
  isCurrentPeriod: boolean;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onJumpToCurrent: () => void;
  records: CalendarRecord[] | undefined;
  isLoading: boolean;
  holidays?: Array<{ date: string; title: string }>;
  weekendDays?: string[];
  joiningDate?: string | null;
  /** Organization's current date (YYYY-MM-DD), resolved server-side. */
  todayKey: string;
  onRequestCorrection: (day: CalendarDayItem) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LEGEND: Array<{ key: keyof ReturnType<typeof generateMonthCalendarDays>["stats"]; label: string; bar: string }> = [
  { key: "workingDays", label: "Working days", bar: "bg-blue-600" },
  { key: "present", label: "Present", bar: "bg-emerald-500" },
  { key: "late", label: "Late", bar: "bg-amber-500" },
  { key: "leave", label: "Leave", bar: "bg-indigo-500" },
  { key: "absent", label: "Absent", bar: "bg-rose-500" },
  { key: "noRecord", label: "No record", bar: "bg-muted-foreground/50" },
];

export function AttendanceCalendarCard({
  period,
  isCurrentPeriod,
  onPrevPeriod,
  onNextPeriod,
  onJumpToCurrent,
  records,
  isLoading,
  holidays,
  weekendDays,
  joiningDate,
  todayKey,
  onRequestCorrection,
}: Props) {
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [inspectedDay, setInspectedDay] = useState<CalendarDayItem | null>(null);

  const { days, stats } = useMemo(
    () =>
      generateMonthCalendarDays(
        period.startDate,
        period.endDate,
        records,
        holidays,
        weekendDays,
        joiningDate,
        todayKey,
      ),
    [period.startDate, period.endDate, records, holidays, weekendDays, joiningDate, todayKey],
  );

  const handleDayClick = (item: CalendarDayItem) => {
    setSelectedDateKey(item.date);
    setInspectedDay(item);
  };

  return (
    <Card className="rounded-3xl border-border/70 bg-card p-5 sm:p-6 shadow-xs">
      <CardHeader className="p-0 pb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="font-heading text-lg font-bold text-foreground">
              Attendance calendar
            </CardTitle>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onPrevPeriod}
                className="inline-flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="size-3.5" />
              </button>
              <span className="text-sm font-bold text-foreground" title={`${period.startDate} → ${period.endDate}`}>
                {period.label}
              </span>
              <button
                type="button"
                onClick={onNextPeriod}
                className="inline-flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Next month"
              >
                <ChevronRightIcon className="size-3.5" />
              </button>
              {!isCurrentPeriod && (
                <button
                  type="button"
                  onClick={onJumpToCurrent}
                  className="ml-1 text-xs font-bold text-primary hover:underline"
                >
                  This month
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-start sm:self-auto">
            {LEGEND.map((entry) => (
              <div key={entry.key} className="flex items-center gap-2">
                <div className={`h-6 w-[3px] rounded-full ${entry.bar}`} />
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-extrabold text-foreground leading-none">
                    {stats[entry.key]}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                    {entry.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        <div className="space-y-2">
          <div className="grid grid-cols-7 rounded-2xl bg-muted/40 dark:bg-muted/20 py-2.5 text-center text-xs font-semibold text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div
            className={`grid grid-cols-7 gap-y-2 sm:gap-y-3 gap-x-1 sm:gap-x-2 pt-1 transition-opacity ${
              isLoading ? "opacity-40" : ""
            }`}
          >
            {days.map((item, idx) => {
              if (!item.isInPeriod) {
                return <div key={`empty-${idx}`} className="max-w-[72px] h-[53px] w-full mx-auto" />;
              }

              // Before the employee joined — not part of their attendance.
              if (item.status === "PRE_HIRE") {
                return (
                  <div
                    key={`${item.date}-${idx}`}
                    className="flex max-w-[72px] h-[53px] w-full mx-auto items-center justify-center rounded-[12px]"
                  >
                    <span className="font-heading text-xs font-bold text-muted-foreground/30">
                      {item.day}
                    </span>
                  </div>
                );
              }

              const isSelected = selectedDateKey === item.date;
              const isAbsent = item.status === "ABSENT";
              const isLate = item.status === "LATE";
              const isPresent = item.status === "PRESENT";
              const isOff = item.status === "OFF";
              const isHoliday = item.status === "HOLIDAY";
              const isLeave = item.status === "LEAVE";

              let buttonBg = "hover:bg-muted/40";
              if (isAbsent) buttonBg = "bg-rose-500/[0.06] dark:bg-rose-500/10 hover:bg-rose-500/10";
              else if (isLate) buttonBg = "bg-amber-500/[0.07] dark:bg-amber-500/10 hover:bg-amber-500/15";
              else if (isLeave) buttonBg = "bg-indigo-500/[0.06] dark:bg-indigo-500/10 hover:bg-indigo-500/10";

              return (
                <button
                  key={`${item.date}-${idx}`}
                  type="button"
                  onClick={() => handleDayClick(item)}
                  className={`group relative flex max-w-[72px] h-[53px] w-full mx-auto flex-col items-center justify-center rounded-[12px] p-1 transition-all duration-150 focus:outline-none ${buttonBg} ${
                    isSelected ? "border-2 border-primary" : "border-2 border-transparent"
                  }`}
                >
                  <span
                    className={`font-heading text-xs font-bold ${
                      item.isToday
                        ? "text-primary underline decoration-2 underline-offset-4"
                        : isAbsent
                        ? "text-rose-600 dark:text-rose-400"
                        : isLate
                        ? "text-amber-600 dark:text-amber-400"
                        : isLeave
                        ? "text-indigo-600 dark:text-indigo-400"
                        : isOff
                        ? "text-muted-foreground/80"
                        : "text-foreground"
                    }`}
                  >
                    {item.day}
                  </span>

                  <div className="mt-0.5 flex flex-col items-center justify-center min-h-[16px]">
                    {isPresent && (
                      <span className="inline-flex items-center justify-center rounded-md bg-emerald-500/15 dark:bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Present
                      </span>
                    )}
                    {isOff && <span className="text-[10px] font-bold text-muted-foreground/80">(Off)</span>}
                    {isAbsent && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Absent</span>
                    )}
                    {isLate && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Late</span>
                    )}
                    {isHoliday && (
                      <span className="inline-flex items-center justify-center rounded-md bg-blue-500/15 dark:bg-blue-500/20 px-1.5 py-0.2 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        Holiday
                      </span>
                    )}
                    {isLeave && (
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Leave</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>

      <DayDetailsModal
        day={inspectedDay}
        isOpen={Boolean(inspectedDay)}
        onClose={() => setInspectedDay(null)}
        onRequestCorrection={(day) => {
          setInspectedDay(null);
          onRequestCorrection(day);
        }}
      />
    </Card>
  );
}
