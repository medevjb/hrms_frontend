"use client";

import { useEffect, useState } from "react";
import { parseISO } from "date-fns";
import { CheckCircle2Icon, ClockIcon, LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { ApiError } from "@/lib/api-error";
import { formatTimeInTimezone } from "@/lib/format-time";
import { useAttendanceToday, useCheckOut } from "@/services/attendance";
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

  async function handleCheckOut() {
    try {
      await checkOut.mutateAsync();
      toast.success("Checked out");
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Check-out failed");
    }
  }

  const checkedInAt = record?.check_in ? parseISO(record.check_in) : null;
  const workedMinutes = checkedInAt && !record?.check_out
    ? Math.floor((now.getTime() - checkedInAt.getTime()) / 60_000)
    : (record?.worked_minutes ?? null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Today&apos;s attendance</CardTitle>
          {record && <StatusChip tone={STATUS_TONE[record.status]}>{record.status.replace("_", " ")}</StatusChip>}
        </div>
      </CardHeader>
      <CardContent>
        {!record ? (
          <p className="text-sm text-muted-foreground">You haven&apos;t checked in yet today.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4 text-emerald-600" />
              <div>
                <p className="text-xs text-muted-foreground">Checked in</p>
                <p className="font-mono text-sm">
                  {record.check_in ? formatTimeInTimezone(record.check_in, user.organization.timezone) : "—"}
                </p>
              </div>
            </div>
            {workedMinutes !== null && (
              <div className="flex items-center gap-2">
                <ClockIcon className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{record.check_out ? "Worked" : "Working"}</p>
                  <p className="font-mono text-sm">{formatDuration(workedMinutes)}</p>
                </div>
              </div>
            )}
            {!record.check_out && (
              <Button size="sm" variant="outline" onClick={handleCheckOut} disabled={checkOut.isPending}>
                <LogOutIcon />
                Check out
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
