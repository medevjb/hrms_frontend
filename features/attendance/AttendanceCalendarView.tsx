"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "@/components/ui/toast";
import { useReportingPeriod } from "@/hooks/use-reporting-period";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { AttendanceCalendarCard } from "@/features/dashboard/components/AttendanceCalendarCard";
import type { CalendarDayItem } from "@/features/dashboard/mockData";
import type { CalendarRecord } from "@/features/dashboard/utils";
import { EmployeeSelect } from "@/features/organization/EmployeeSelect";
import { formatTimeInTimezone } from "@/lib/format-time";
import { useAttendanceMonth, useAttendanceToday } from "@/services/attendance";
import { useDashboard } from "@/services/dashboard";
import { useHolidays } from "@/services/holidays";
import { useProfile } from "@/services/profile";
import type { AttendanceRecord } from "@/types/attendance";
import { AdjustAttendanceDialog } from "./AdjustAttendanceDialog";
import { AttendanceMonthList } from "./AttendanceMonthList";

function minutesToHours(minutes: number | null): string | null {
  if (minutes == null) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * The dashboard's attendance calendar, on its own page. Defaults to the
 * viewer's own month; anyone who can see other people (employee.view) gets
 * an employee picker. A right-hand list mirrors the grid as check-in /
 * check-out / status rows for the visible month.
 */
export function AttendanceCalendarView() {
  const user = useCurrentUser();
  const timezone = user.organization.timezone;
  const canViewOthers = user.permissions.includes("employee.view");
  const canCorrect = user.permissions.includes("attendance.correct");

  const { data: profile } = useProfile();
  const { data: dashboard } = useDashboard();
  const { data: today } = useAttendanceToday();
  const { data: holidays } = useHolidays();

  const [pickedId, setPickedId] = useState<string | null>(null);
  const [correctionRecord, setCorrectionRecord] = useState<AttendanceRecord | null>(null);

  const { period, isCurrent, goPrev, goNext, goToCurrent } = useReportingPeriod();

  const ownId = profile?.employee?.id;
  const targetId = pickedId ? Number(pickedId) : ownId;
  const viewingSelf = targetId === ownId;

  const orgTodayKey = today?.work_date ?? format(new Date(), "yyyy-MM-dd");
  const monthFrom = period.startDate;
  const monthTo = period.endDate;

  const { data: monthRecords, isLoading } = useAttendanceMonth(targetId, monthFrom, monthTo);

  const calendarRecords: CalendarRecord[] | undefined = useMemo(
    () =>
      monthRecords?.map((record) => ({
        work_date: record.work_date,
        status: record.status,
        check_in: record.check_in ? formatTimeInTimezone(record.check_in, timezone) : null,
        check_out: record.check_out ? formatTimeInTimezone(record.check_out, timezone) : null,
        worked_hours: minutesToHours(record.worked_minutes),
        late_minutes: record.late_minutes,
        shift_name: record.shift?.name ?? null,
      })),
    [monthRecords, timezone],
  );

  const holidayList = useMemo(
    () => holidays?.filter((h) => h.active).map((h) => ({ date: h.date, title: h.title })),
    [holidays],
  );

  const monthList = useMemo(
    () =>
      (monthRecords ?? []).filter(
        (record) => record.work_date >= monthFrom && record.work_date <= monthTo,
      ),
    [monthRecords, monthFrom, monthTo],
  );

  function requestCorrection(day: CalendarDayItem) {
    const match = monthRecords?.find((record) => record.work_date === day.date);
    if (!match) {
      toast.info("There's no attendance record for that day.");
      return;
    }
    setCorrectionRecord(match);
  }

  return (
    <div className="space-y-4">
      {canViewOthers && (
        <div className="max-w-sm">
          <EmployeeSelect label="Viewing" value={pickedId} onChange={setPickedId} />
          {pickedId && (
            <button
              type="button"
              className="mt-1 text-xs text-primary hover:underline"
              onClick={() => setPickedId(null)}
            >
              Back to my attendance
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <AttendanceCalendarCard
            period={period}
            isCurrentPeriod={isCurrent}
            onPrevPeriod={goPrev}
            onNextPeriod={goNext}
            onJumpToCurrent={goToCurrent}
            records={calendarRecords}
            isLoading={isLoading}
            holidays={holidayList}
            weekendDays={viewingSelf ? dashboard?.widgets.me?.weekend_days : undefined}
            joiningDate={viewingSelf ? profile?.employee?.joining_date : undefined}
            todayKey={orgTodayKey}
            onRequestCorrection={requestCorrection}
          />
        </div>

        <div className="xl:col-span-4">
          <AttendanceMonthList
            title={period.label}
            records={monthList}
            timezone={timezone}
            todayKey={orgTodayKey}
            isLoading={isLoading}
            canCorrect={canCorrect}
            onCorrect={setCorrectionRecord}
            onPrevMonth={goPrev}
            onNextMonth={goNext}
          />
        </div>
      </div>

      <AdjustAttendanceDialog
        record={correctionRecord}
        onClose={() => setCorrectionRecord(null)}
      />
    </div>
  );
}
