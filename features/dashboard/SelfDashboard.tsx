"use client";

import { useMemo, useState } from "react";
import { toast } from "@/components/ui/toast";
import { format, parseISO } from "date-fns";
import { useReportingPeriod } from "@/hooks/use-reporting-period";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useProfile } from "@/services/profile";
import { useDashboard } from "@/services/dashboard";
import {
  useAttendanceToday,
  useCheckIn,
  useCheckOut,
  useAttendanceMonth,
} from "@/services/attendance";
import { formatTimeInTimezone } from "@/lib/format-time";
import { SubmitLeaveRequestDialog } from "@/features/leave/SubmitLeaveRequestDialog";
import { AdjustAttendanceDialog } from "@/features/attendance/AdjustAttendanceDialog";
import type { AttendanceRecord } from "@/types/attendance";

import { EmployeeHeroHeader } from "./components/EmployeeHeroHeader";
import { TopStatCards } from "./components/TopStatCards";
import { AttendanceCalendarCard } from "./components/AttendanceCalendarCard";
import { TodayScheduleCard } from "./components/TodayScheduleCard";
import { LeaveBalanceCard } from "./components/LeaveBalanceCard";
import { QuickActionsAndAnnouncements } from "./components/QuickActionsAndAnnouncements";
import type { CalendarRecord } from "./utils";
import { calculateLengthOfService } from "./utils";
import type { CalendarDayItem, DashboardKPI } from "./mockData";

/** Format a clock value for display — accepts an ISO timestamp (shift/grace
 *  times come back as ISO) or a bare wall-clock "HH:MM" (break times). */
function clock(value: string | null | undefined, timezone: string): string | null {
  if (!value) return null;
  if (value.includes("T")) return formatTimeInTimezone(value, timezone);

  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDay(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function minutesToHours(minutes: number | null): string | null {
  if (minutes == null) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function SelfDashboard() {
  const user = useCurrentUser();
  const timezone = user.organization.timezone;

  const { data: profile } = useProfile();
  const { data: dashboard } = useDashboard();
  const { data: today } = useAttendanceToday();

  // The org's current date, resolved server-side in the org timezone
  // (docs/PRD.md §142) — the browser clock may be a day off and would hide
  // a day the employee has already worked. Falls back to the browser date
  // only until /attendance/today lands.
  const orgTodayKey = today?.work_date ?? format(new Date(), "yyyy-MM-dd");

  const { period, isCurrent, goPrev, goNext, goToCurrent } = useReportingPeriod();
  const employeeId = profile?.employee?.id;
  const { data: monthRecords, isLoading: monthLoading } = useAttendanceMonth(
    employeeId,
    period.startDate,
    period.endDate,
  );

  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [correctionRecord, setCorrectionRecord] = useState<AttendanceRecord | null>(null);

  const me = dashboard?.widgets.me;
  const record = today?.record ?? null;
  const isCheckedIn = Boolean(record?.check_in && !record?.check_out);

  const calendarRecords: CalendarRecord[] | undefined = useMemo(
    () =>
      monthRecords?.map((r) => ({
        work_date: r.work_date,
        status: r.status,
        check_in: r.check_in ? formatTimeInTimezone(r.check_in, timezone) : null,
        check_out: r.check_out ? formatTimeInTimezone(r.check_out, timezone) : null,
        worked_hours: minutesToHours(r.worked_minutes),
        late_minutes: r.late_minutes,
        shift_name: r.shift?.name ?? null,
      })),
    [monthRecords, timezone],
  );

  const holidays = useMemo(
    () => dashboard?.widgets.upcoming_holidays?.map((h) => ({ date: h.date, title: h.title })),
    [dashboard],
  );

  const attendanceStatus = record?.status
    ? record.status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
    : today?.is_work_day === false
      ? today?.is_holiday
        ? "Holiday"
        : "Weekly off"
      : "Not checked in";

  const kpi: DashboardKPI = {
    workingPeriod: {
      startTime: clock(today?.shift_start, timezone),
      endTime: clock(today?.shift_end, timezone),
      statusText: today?.is_work_day === false ? "No shift today" : "Please check in",
      isCheckedIn,
      checkInTime: record?.check_in ? formatTimeInTimezone(record.check_in, timezone) : null,
      checkOutTime: record?.check_out ? formatTimeInTimezone(record.check_out, timezone) : null,
    },
    lengthOfService: {
      duration: calculateLengthOfService(profile?.employee?.joining_date),
      joiningDate: profile?.employee?.joining_date ? formatDay(profile.employee.joining_date) : null,
    },
    upcomingLeave: me?.next_approved_leave
      ? {
          leaveType: me.next_approved_leave.leave_type,
          dateFormatted: formatDay(me.next_approved_leave.start_date),
          status: "APPROVED",
          daysCount: me.next_approved_leave.days_requested,
        }
      : null,
    attendanceToday: {
      status: attendanceStatus,
      subtext: record?.check_in
        ? `In at ${formatTimeInTimezone(record.check_in, timezone)}`
        : today?.grace_end
          ? `Grace until ${clock(today.grace_end, timezone)}`
          : "",
      tone: record?.status === "LATE" ? "warning" : record?.status === "ABSENT" ? "danger" : "success",
    },
  };

  function handleCheckIn() {
    checkIn.mutate(undefined, {
      onSuccess: () => toast.success("Checked in. Have a good day."),
    });
  }

  function handleCheckOut() {
    checkOut.mutate(undefined, {
      onSuccess: () => toast.success("Checked out. See you tomorrow."),
    });
  }

  function handleDayCorrection(day: CalendarDayItem) {
    const match = monthRecords?.find((r) => r.work_date === day.date);
    if (!match) {
      toast.info("There's no attendance record for that day to correct.");
      return;
    }
    setCorrectionRecord(match);
  }

  function handleGeneralCorrection() {
    if (record) {
      setCorrectionRecord(record);
      return;
    }
    toast.info("You can request a correction from a day on the calendar.");
  }

  const displayName = profile?.employee?.full_name ?? user.name;

  return (
    <div className="space-y-6">
      <EmployeeHeroHeader
        userName={displayName}
        designation={profile?.employee?.designation ?? null}
        employeeCode={profile?.employee?.employee_code ?? null}
        onRequestLeave={() => setLeaveOpen(true)}
        onRequestAdjustment={handleGeneralCorrection}
      />

      <TopStatCards
        kpi={kpi}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onRequestLeave={() => setLeaveOpen(true)}
        isCheckInPending={checkIn.isPending}
        isCheckOutPending={checkOut.isPending}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7 2xl:col-span-8">
          <AttendanceCalendarCard
            period={period}
            isCurrentPeriod={isCurrent}
            onPrevPeriod={goPrev}
            onNextPeriod={goNext}
            onJumpToCurrent={goToCurrent}
            records={calendarRecords}
            isLoading={monthLoading}
            holidays={holidays}
            weekendDays={me?.weekend_days}
            joiningDate={profile?.employee?.joining_date}
            todayKey={orgTodayKey}
            onRequestCorrection={handleDayCorrection}
          />
        </div>

        <div className="space-y-6 xl:col-span-5 2xl:col-span-4">
          <TodayScheduleCard
            dateFormatted={new Intl.DateTimeFormat(undefined, {
              day: "2-digit",
              month: "short",
              weekday: "long",
            }).format(parseISO(orgTodayKey))}
            isWorkDay={today?.is_work_day ?? true}
            nonWorkReason={
              today?.is_holiday ? "Public holiday" : today?.is_weekend ? "Weekly off" : null
            }
            shiftStart={clock(today?.shift_start, timezone)}
            shiftEnd={clock(today?.shift_end, timezone)}
            graceEnd={clock(today?.grace_end, timezone)}
            breakStart={clock(today?.break_start, timezone)}
            breakEnd={clock(today?.break_end, timezone)}
            checkInActual={record?.check_in ? formatTimeInTimezone(record.check_in, timezone) : null}
            checkOutActual={
              record?.check_out ? formatTimeInTimezone(record.check_out, timezone) : null
            }
          />

          <LeaveBalanceCard
            balances={me?.leave_balances}
            isLoading={!dashboard}
            onRequestLeave={() => setLeaveOpen(true)}
          />
        </div>
      </div>

      <QuickActionsAndAnnouncements
        holidays={dashboard?.widgets.upcoming_holidays}
        announcements={dashboard?.widgets.announcements}
        onRequestLeave={() => setLeaveOpen(true)}
        onRequestAdjustment={handleGeneralCorrection}
      />

      <SubmitLeaveRequestDialog opened={leaveOpen} onClose={() => setLeaveOpen(false)} />
      <AdjustAttendanceDialog record={correctionRecord} onClose={() => setCorrectionRecord(null)} />
    </div>
  );
}
