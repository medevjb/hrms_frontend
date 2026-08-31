"use client";

import { useState, useEffect } from "react";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  LogInIcon,
  LogOutIcon,
  PalmtreeIcon,
  TrophyIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DashboardKPI } from "../mockData";

type Props = {
  kpi: DashboardKPI;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onRequestLeave?: () => void;
  isCheckInPending?: boolean;
  isCheckOutPending?: boolean;
};

export function TopStatCards({
  kpi,
  onCheckIn,
  onCheckOut,
  onRequestLeave,
  isCheckInPending,
  isCheckOutPending,
}: Props) {
  const [isCheckedInState, setIsCheckedInState] = useState<boolean>(kpi.workingPeriod.isCheckedIn);

  useEffect(() => {
    setIsCheckedInState(kpi.workingPeriod.isCheckedIn);
  }, [kpi.workingPeriod.isCheckedIn]);

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Today Working Period */}
      <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-border/70 bg-card p-3.5 shadow-xs transition-all duration-200 hover:border-emerald-500/40 hover:shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
              Today Working Period
            </p>
            <h3 className="font-heading text-base font-bold text-foreground truncate">
              {isCheckedInState
                ? kpi.workingPeriod.checkInTime
                  ? `In at ${kpi.workingPeriod.checkInTime}`
                  : "Checked In"
                : kpi.workingPeriod.statusText}
            </h3>
            <p className="font-mono text-[11px] text-muted-foreground">
              {kpi.workingPeriod.startTime} - {kpi.workingPeriod.endTime}
            </p>
          </div>

          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
            <ClockIcon className="size-4.5" />
          </div>
        </div>

        {/* Compact Action / Status */}
        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between">
          {!isCheckedInState ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCheckIn}
              disabled={isCheckInPending}
              className="h-6.5 w-full rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] px-2"
            >
              <LogInIcon className="mr-1 size-3" />
              Check-In Now
            </Button>
          ) : (
            <div className="flex w-full items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Working
              </span>
              <button
                type="button"
                onClick={onCheckOut}
                disabled={isCheckOutPending}
                className="text-[11px] font-semibold text-rose-600 hover:underline"
              >
                Check Out
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* 2. Length of Service */}
      <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-border/70 bg-card p-3.5 shadow-xs transition-all duration-200 hover:border-indigo-500/40 hover:shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
              Length of Service
            </p>
            <h3 className="font-heading text-base font-bold text-foreground truncate">
              {kpi.lengthOfService.duration}
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">
              Joined {kpi.lengthOfService.joiningDate}
            </p>
          </div>

          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20">
            <TrophyIcon className="size-4.5" />
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-medium text-indigo-600 dark:text-indigo-400">Full-Time Regular</span>
          <span className="font-mono text-[10px] text-muted-foreground">Active</span>
        </div>
      </Card>

      {/* 3. Upcoming Leave */}
      <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-border/70 bg-card p-3.5 shadow-xs transition-all duration-200 hover:border-amber-500/40 hover:shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
              Upcoming Leave
            </p>
            <h3 className="font-heading text-base font-bold text-foreground truncate">
              {kpi.upcomingLeave.leaveType}
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">
              {kpi.upcomingLeave.dateFormatted}
            </p>
          </div>

          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
            <PalmtreeIcon className="size-4.5" />
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {kpi.upcomingLeave.status === "APPROVED" ? "Approved" : "In Review"}
          </span>
          <button
            type="button"
            onClick={onRequestLeave}
            className="font-semibold text-primary hover:underline"
          >
            Apply →
          </button>
        </div>
      </Card>

      {/* 4. Attendance Today */}
      <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-border/70 bg-card p-3.5 shadow-xs transition-all duration-200 hover:border-emerald-500/40 hover:shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
              Attendance Today
            </p>
            <h3 className="font-heading text-base font-bold text-emerald-600 dark:text-emerald-400 truncate">
              {kpi.attendanceToday.status}
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">
              {kpi.attendanceToday.subtext}
            </p>
          </div>

          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
            <CalendarDaysIcon className="size-4.5" />
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2Icon className="size-3" /> Shift Compliant
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">Grace: 15m</span>
        </div>
      </Card>
    </div>
  );
}
