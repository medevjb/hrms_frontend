"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarDaysIcon,
  CoffeeIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  dateFormatted?: string;
  checkInTime?: string;
  lunchBreakTime?: string;
  checkOutTime?: string;
};

export function TodayScheduleCard({
  dateFormatted = "11 May, Monday",
  checkInTime = "09:00 AM",
  lunchBreakTime = "01:00 PM - 01:30 PM",
  checkOutTime = "06:00 PM",
}: Props) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card p-4 sm:p-5 shadow-xs">
      <CardHeader className="p-0 pb-4">
        <div>
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Today&apos;s Schedule
          </CardTitle>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <CalendarDaysIcon className="size-3.5 text-primary" /> {dateFormatted}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {/* Continuous Step Timeline matching reference layout */}
        <div className="relative space-y-5">
          {/* Vertical Connecting Line */}
          <div className="absolute left-[13px] top-3 bottom-3 w-[2px] bg-border/80" />

          {/* 1. Check-In Item */}
          <div className="relative flex items-center gap-3.5">
            {/* Green Up Arrow Indicator */}
            <div className="relative z-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-4 ring-card">
              <ArrowUpIcon className="size-3.5 stroke-[2.5]" />
            </div>

            <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-foreground">
                {checkInTime}
              </span>
              <span className="text-xs font-medium text-muted-foreground truncate">
                Check-In
              </span>
            </div>
          </div>

          {/* 2. Lunch Break Item */}
          <div className="relative flex items-center gap-3.5">
            {/* Break Indicator */}
            <div className="relative z-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-4 ring-card">
              <CoffeeIcon className="size-3.5" />
            </div>

            <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-foreground">
                {lunchBreakTime}
              </span>
              <span className="text-xs font-medium text-muted-foreground truncate">
                Lunch Break
              </span>
            </div>
          </div>

          {/* 3. Check-Out Item */}
          <div className="relative flex items-center gap-3.5">
            {/* Red Down Arrow Indicator */}
            <div className="relative z-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-4 ring-card">
              <ArrowDownIcon className="size-3.5 stroke-[2.5]" />
            </div>

            <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-foreground">
                {checkOutTime}
              </span>
              <span className="text-xs font-medium text-muted-foreground truncate">
                Check-Out
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
