"use client";

import { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportingPeriod } from "@/lib/reporting-period";
import { cn } from "@/lib/utils";

export type CalendarChip = {
  key: string | number;
  label: string;
  /** Chip background + text colour classes. */
  className: string;
  /** Optional leading dot colour class. */
  dotClassName?: string;
  /** Render dimmed + struck through (e.g. an inactive holiday). */
  muted?: boolean;
  onClick?: () => void;
};

type Props = {
  /** The reporting period in view (docs/PRD.md §85). */
  period: ReportingPeriod;
  isCurrentPeriod: boolean;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onJumpToCurrent: () => void;
  chipsForDate: (iso: string) => CalendarChip[];
  onDayClick?: (iso: string) => void;
  /** Rendered on the right of the month header. */
  actions?: React.ReactNode;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_CHIPS_PER_DAY = 3;

/**
 * A month grid in the Google-Calendar mould — each day cell carries its
 * events as inline chips. Shared by the holiday calendar and the personal
 * "My events" calendar so the two look and behave identically.
 */
export function MonthCalendar({
  period,
  isCurrentPeriod,
  onPrevPeriod,
  onNextPeriod,
  onJumpToCurrent,
  chipsForDate,
  onDayClick,
  actions,
}: Props) {
  const weeks = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfWeek(parseISO(period.startDate)),
      end: endOfWeek(parseISO(period.endDate)),
    });
    const chunks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7));
    }
    return chunks;
  }, [period.startDate, period.endDate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <h2
            className="font-heading text-lg font-bold text-foreground"
            title={`${period.startDate} → ${period.endDate}`}
          >
            {period.label}
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onPrevPeriod}
            aria-label="Previous month"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onNextPeriod}
            aria-label="Next month"
          >
            <ChevronRightIcon />
          </Button>
          {!isCurrentPeriod && (
            <Button variant="ghost" size="sm" onClick={onJumpToCurrent}>
              Today
            </Button>
          )}
        </div>
        {actions}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="divide-y divide-border">
          {weeks.map((week) => (
            <div key={week[0].toISOString()} className="grid grid-cols-7 divide-x divide-border">
              {week.map((day) => {
                const iso = format(day, "yyyy-MM-dd");
                const chips = chipsForDate(iso);
                const outside = iso < period.startDate || iso > period.endDate;
                const today = isToday(day);

                return (
                  <div
                    key={iso}
                    onClick={() => onDayClick?.(iso)}
                    className={cn(
                      "flex min-h-[104px] flex-col gap-1 p-1.5",
                      outside && "bg-muted/30",
                      onDayClick && "cursor-pointer hover:bg-muted/50",
                    )}
                  >
                    <div className="flex justify-end">
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                          outside ? "text-muted-foreground/60" : "text-foreground",
                          today && "bg-primary text-primary-foreground",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      {chips.slice(0, MAX_CHIPS_PER_DAY).map((chip) => (
                        <button
                          key={chip.key}
                          type="button"
                          title={chip.label}
                          disabled={!chip.onClick}
                          onClick={(event) => {
                            event.stopPropagation();
                            chip.onClick?.();
                          }}
                          className={cn(
                            "flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium",
                            chip.className,
                            chip.onClick && "hover:brightness-95",
                            chip.muted && "opacity-50 line-through",
                          )}
                        >
                          {chip.dotClassName && (
                            <span className={cn("size-1.5 shrink-0 rounded-full", chip.dotClassName)} />
                          )}
                          <span className="truncate">{chip.label}</span>
                        </button>
                      ))}
                      {chips.length > MAX_CHIPS_PER_DAY && (
                        <span className="px-1.5 text-[11px] font-medium text-muted-foreground">
                          +{chips.length - MAX_CHIPS_PER_DAY} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
