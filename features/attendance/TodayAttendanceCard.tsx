"use client";

import { useEffect, useState } from "react";
import { parseISO } from "date-fns";
import { CheckCircle2Icon, ClockIcon, LogInIcon, LogOutIcon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { ApiError } from "@/lib/api-error";
import { formatTimeInTimezone } from "@/lib/format-time";
import { useAttendanceToday, useCheckIn, useCheckOut } from "@/services/attendance";
import type { AttendanceStatus } from "@/types/attendance";

const STATUS_TONE: Record<AttendanceStatus, StatusTone> = {
  PRESENT: "success",
  LATE: "warning",
  ABSENT: "danger",
  ON_LEAVE: "info",
  HOLIDAY: "info",
  WEEKEND: "neutral",
  HALF_DAY: "warning",
  MISSING_CHECKOUT: "danger",
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * The §27 checkout flow, and a persistent glance at today's status —
 * doesn't render at all on a weekend/holiday with no shift and no record,
 * since there's nothing to say.
 */
export function TodayAttendanceCard() {
  const user = useCurrentUser();
  const { data: today, isLoading } = useAttendanceToday();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !today) {
    return null;
  }

  const record = today.record;

  if (!record && !today.is_work_day) {
    return null;
  }

  async function handleCheckIn() {
    try {
      await checkIn.mutateAsync();
      toast.success("Checked in");
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Check-in failed");
    }
  }

  async function handleCheckOut() {
    try {
      await checkOut.mutateAsync();
      toast.success("Checked out successfully");
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Check-out failed");
    }
  }

  const checkedInAt = record?.check_in ? parseISO(record.check_in) : null;
  const workedMinutes = checkedInAt && !record?.check_out
    ? Math.floor((now.getTime() - checkedInAt.getTime()) / 60_000)
    : (record?.worked_minutes ?? null);

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <CardTitle className="text-base font-bold">Today&apos;s attendance</CardTitle>
          </div>
          {record && <StatusChip tone={STATUS_TONE[record.status]}>{record.status.replace("_", " ")}</StatusChip>}
        </div>
      </CardHeader>
      <CardContent>
        {!record ? (
          <div className="flex flex-wrap items-center justify-between gap-3 py-1">
            <p className="text-sm text-muted-foreground">You haven&apos;t checked in yet today.</p>
            <Button size="sm" className="rounded-xl" onClick={handleCheckIn} disabled={checkIn.isPending}>
              <LogInIcon className="mr-1.5 size-4" />
              Check in
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2Icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Checked in</p>
                  <p className="font-mono text-sm font-bold text-foreground">
                    {record.check_in ? formatTimeInTimezone(record.check_in, user.organization.timezone) : "—"}
                  </p>
                </div>
              </div>

              {workedMinutes !== null && (
                <div className="flex items-center gap-3 border-l border-border/60 pl-6">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20">
                    <ClockIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{record.check_out ? "Total worked" : "Current duration"}</p>
                    <p className="font-mono text-sm font-bold text-foreground">{formatDuration(workedMinutes)}</p>
                  </div>
                </div>
              )}
            </div>

            {!record.check_out && (
              <Button size="sm" variant="outline" className="rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40" onClick={handleCheckOut} disabled={checkOut.isPending}>
                <LogOutIcon className="size-4 mr-1.5" />
                Check out
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

