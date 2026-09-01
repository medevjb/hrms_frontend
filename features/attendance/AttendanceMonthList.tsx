"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarX2Icon, ChevronLeftIcon, ChevronRightIcon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTimeInTimezone } from "@/lib/format-time";
import { cn } from "@/lib/utils";
import type { AttendanceRecord, AttendanceStatus } from "@/types/attendance";

const STATUS: Record<AttendanceStatus, { label: string; dot: string; text: string; reason: string }> = {
  PRESENT: { label: "Present", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", reason: "Present" },
  LATE: { label: "Late", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", reason: "Late arrival" },
  HALF_DAY: { label: "Half day", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", reason: "Half day" },
  MISSING_CHECKOUT: { label: "Missing checkout", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", reason: "Never checked out" },
  ABSENT: { label: "Absent", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", reason: "No attendance recorded" },
  ON_LEAVE: { label: "On leave", dot: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", reason: "Approved leave" },
  HOLIDAY: { label: "Holiday", dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", reason: "Public holiday" },
  WEEKEND: { label: "Weekly off", dot: "bg-muted-foreground/40", text: "text-muted-foreground", reason: "Weekly off" },
};

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All days" },
  { value: "PRESENT", label: "Present" },
  { value: "LATE", label: "Late" },
  { value: "ABSENT", label: "Absent" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "HALF_DAY", label: "Half day" },
  { value: "MISSING_CHECKOUT", label: "Missing checkout" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "WEEKEND", label: "Weekly off" },
];

function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** "9:22 AM" -> "9:22a"; leaves 24-hour locales untouched. */
function shortTime(iso: string | null, timezone: string): string {
  if (!iso) return "—";
  return formatTimeInTimezone(iso, timezone)
    .replace(/\s?AM$/i, "a")
    .replace(/\s?PM$/i, "p");
}

type Props = {
  /** The reporting period label, e.g. "September 2026". */
  title: string;
  records: AttendanceRecord[];
  timezone: string;
  todayKey: string;
  isLoading: boolean;
  canCorrect: boolean;
  onCorrect: (record: AttendanceRecord) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

/**
 * The day-by-day companion to the attendance calendar. A single record
 * rail threads the month newest-first, each day a node on it, so a run of
 * late or absent days stands out at a glance. Filters by status, keeps its
 * own scroll so a long month never stretches the page.
 */
export function AttendanceMonthList({
  title,
  records,
  timezone,
  todayKey,
  isLoading,
  canCorrect,
  onCorrect,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(
    () => [...records].sort((a, b) => b.work_date.localeCompare(a.work_date)),
    [records],
  );

  const filtered = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);

  const summary = useMemo(() => {
    const s = { present: 0, late: 0, absent: 0, leave: 0 };
    for (const r of rows) {
      if (r.status === "PRESENT" || r.status === "MISSING_CHECKOUT") s.present += 1;
      else if (r.status === "LATE") s.late += 1;
      else if (r.status === "ABSENT") s.absent += 1;
      else if (r.status === "ON_LEAVE" || r.status === "HALF_DAY") s.leave += 1;
    }
    return s;
  }, [rows]);

  const tiles = [
    { label: "Present", value: summary.present, cls: "text-emerald-600 dark:text-emerald-400" },
    { label: "Late", value: summary.late, cls: "text-amber-600 dark:text-amber-400" },
    { label: "Absent", value: summary.absent, cls: "text-rose-600 dark:text-rose-400" },
    { label: "Leave", value: summary.leave, cls: "text-indigo-600 dark:text-indigo-400" },
  ];

  return (
    <Card className="h-fit">
      <CardContent className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-[0.95rem] font-bold text-foreground">
            {title}
          </h3>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon-sm" onClick={onPrevMonth} aria-label="Previous month">
              <ChevronLeftIcon />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onNextMonth} aria-label="Next month">
              <ChevronRightIcon />
            </Button>
          </div>
        </div>

        <div className="flex items-stretch divide-x divide-border/50 rounded-lg border border-border/60 bg-muted/20 py-2">
          {tiles.map((tile) => (
            <div key={tile.label} className="flex flex-1 flex-col items-center gap-0.5 px-1">
              <span className={cn("font-heading text-sm font-bold tabular-nums", tile.cls)}>
                {tile.value}
              </span>
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                {tile.label}
              </span>
            </div>
          ))}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading ? (
          <div className="space-y-3 py-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1 size-2 shrink-0 rounded-full bg-muted" />
                <div className="h-4 w-7 shrink-0 rounded bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-3 w-36 rounded bg-muted/70" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-10 text-center">
            <CalendarX2Icon className="size-5 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              {statusFilter === "all" ? "Nothing recorded" : "No matching days"}
            </p>
            <p className="text-xs text-muted-foreground">
              {statusFilter === "all"
                ? "This month has no attendance yet."
                : "Try a different status filter."}
            </p>
          </div>
        ) : (
          <ul
            className={cn(
              "relative max-h-[560px] overflow-y-auto [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]",
              "[mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-12px),transparent)]",
              "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent",
            )}
          >
            {filtered.map((record) => {
              const meta = STATUS[record.status];
              const date = parseISO(record.work_date);
              const isToday = record.work_date === todayKey;
              const hasTimes = Boolean(record.check_in || record.check_out);
              const late = record.late_minutes ?? 0;

              return (
                <li key={record.id}>
                  <button
                    type="button"
                    disabled={!canCorrect}
                    onClick={() => onCorrect(record)}
                    className={cn(
                      "group flex w-full items-stretch gap-3 rounded-lg py-2.5 pr-1.5 pl-1 text-left transition-colors disabled:cursor-default",
                      "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                      canCorrect && "hover:bg-muted/40",
                    )}
                  >
                    <div className="relative flex w-3.5 shrink-0 justify-center">
                      <span className="absolute inset-y-0 w-px bg-border/70" aria-hidden />
                      <span
                        className={cn(
                          "relative z-10 mt-1 size-2 rounded-full ring-4 ring-card",
                          meta.dot,
                          isToday && "ring-primary/25",
                        )}
                        aria-hidden
                      />
                    </div>

                    <div className="w-7 shrink-0 text-center">
                      <div
                        className={cn(
                          "font-heading text-[15px] leading-none font-bold tabular-nums",
                          isToday ? "text-primary" : "text-foreground",
                        )}
                      >
                        {format(date, "d")}
                      </div>
                      <div className="mt-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                        {format(date, "EEE")}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className={cn("font-semibold", meta.text)}>{meta.label}</span>
                        {record.shift?.name && (
                          <span className="truncate text-muted-foreground">
                            · {record.shift.name}
                          </span>
                        )}
                        {record.is_manual_adjustment && (
                          <PencilIcon
                            className="size-3 shrink-0 text-muted-foreground/50"
                            aria-label="Manually corrected"
                          />
                        )}
                      </div>

                      {hasTimes ? (
                        <div className="font-mono text-[11px] text-muted-foreground">
                          <span className={record.status === "LATE" ? "text-foreground" : undefined}>
                            {shortTime(record.check_in, timezone)}
                          </span>
                          {late > 0 && (
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              {" "}
                              +{late}m
                            </span>
                          )}
                          <span className="mx-1 text-muted-foreground/50">→</span>
                          <span>{shortTime(record.check_out, timezone)}</span>
                          {record.worked_minutes != null && (
                            <span className="text-muted-foreground/70">
                              {" · "}
                              {minutesToHours(record.worked_minutes)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground/70">{meta.reason}</div>
                      )}
                    </div>

                    {canCorrect && (
                      <ChevronRightIcon className="mt-1 size-3.5 shrink-0 self-start text-transparent transition-colors group-hover:text-muted-foreground/50" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
