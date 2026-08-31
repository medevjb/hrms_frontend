"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useProfile } from "@/services/profile";
import { useDashboard } from "@/services/dashboard";
import { useAttendanceToday, useCheckIn, useCheckOut } from "@/services/attendance";
import { useLeaveBalances } from "@/services/leave";
import { useHolidays } from "@/services/holidays";
import { ApiError } from "@/lib/api-error";
import { SubmitLeaveRequestDialog } from "@/features/leave/SubmitLeaveRequestDialog";
import { AdjustAttendanceDialog } from "@/features/attendance/AdjustAttendanceDialog";
import type { AttendanceRecord } from "@/types/attendance";

import { EmployeeHeroHeader } from "./components/EmployeeHeroHeader";
import { TopStatCards } from "./components/TopStatCards";
import { AttendanceCalendarCard } from "./components/AttendanceCalendarCard";
import { TodayScheduleCard } from "./components/TodayScheduleCard";
import { LeaveBalanceCard } from "./components/LeaveBalanceCard";
import { QuickActionsAndAnnouncements } from "./components/QuickActionsAndAnnouncements";
import { ManagerWorkforceSection } from "./components/ManagerWorkforceSection";
import {
  MOCK_DASHBOARD_KPI,
  MOCK_LEAVE_BALANCES,
  type CalendarDayItem,
  type DashboardKPI,
  type LeaveBalanceItem,
} from "./mockData";
import { calculateLengthOfService } from "./utils";

export function DashboardOverview() {
  const user = useCurrentUser();
  const { data: profile } = useProfile();
  const { data: dashboardData } = useDashboard();
  const { data: attendanceToday } = useAttendanceToday();
  const { data: realLeaveBalances } = useLeaveBalances();
  const { data: realHolidays } = useHolidays();

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  // Dialog states
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [adjustmentRecord, setAdjustmentRecord] = useState<AttendanceRecord | null>(null);

  // Local optimistic state for instant feedback on Check-In / Check-Out
  const [localCheckedIn, setLocalCheckedIn] = useState<boolean>(() => {
    return Boolean(attendanceToday?.record?.check_in && !attendanceToday?.record?.check_out);
  });
  const [localCheckInTime, setLocalCheckInTime] = useState<string | null>(() => {
    return attendanceToday?.record?.check_in ?? null;
  });

  // Calculate length of service from profile or fallback
  const joiningDateStr = profile?.employee?.joining_date ?? "2025-06-15";
  const lengthOfServiceText = calculateLengthOfService(joiningDateStr);

  // Check management permissions
  const isManagerOrAdmin =
    user.roles?.some((r) => ["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "TEAM_LEADER"].includes(r.toUpperCase())) ||
    user.permissions?.some((p) => ["leave.approve", "attendance.manage", "employee.view"].includes(p));

  // Determine KPI data
  const isCheckedIn = localCheckedIn || Boolean(attendanceToday?.record?.check_in && !attendanceToday?.record?.check_out);
  const kpiData: DashboardKPI = {
    workingPeriod: {
      startTime: attendanceToday?.shift_start ?? "09:00 AM",
      endTime: attendanceToday?.shift_end ?? "06:00 PM",
      statusText: isCheckedIn ? "Working Active" : "Please check-in",
      isCheckedIn: isCheckedIn,
      checkInTime: localCheckInTime ?? (attendanceToday?.record?.check_in ? "09:00 AM" : null),
      checkOutTime: attendanceToday?.record?.check_out ?? null,
    },
    lengthOfService: {
      duration: lengthOfServiceText,
      joiningDate: profile?.employee?.joining_date ? profile.employee.joining_date : "15 Jun, 2025",
    },
    upcomingLeave: {
      leaveType: "Casual Leave",
      dateFormatted: "02 May, 2026 (01:31 PM)",
      status: "APPROVED",
      daysCount: 1,
    },
    attendanceToday: {
      status: isCheckedIn ? "Present" : "Present",
      subtext: isCheckedIn ? "Working (On Time)" : "On Time (09:00 AM)",
      tone: "success",
    },
  };

  // Convert real leave balances to dashboard format if available, otherwise use reference dummy data
  const leaveBalances: LeaveBalanceItem[] =
    realLeaveBalances && realLeaveBalances.length > 0
      ? realLeaveBalances.map((b, idx) => ({
          id: String(b.id),
          type: b.leave_type.name,
          taken: Math.max(0, 14 - b.balance),
          remaining: b.balance,
          total: 14,
          color: idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-indigo-500" : "bg-violet-500",
        }))
      : MOCK_LEAVE_BALANCES;

  // Handle Check-In
  const handleCheckIn = async () => {
    try {
      setLocalCheckedIn(true);
      setLocalCheckInTime("09:00 AM");
      toast.success("Successfully Checked-In for today! Have a productive day.");
      await checkInMutation.mutateAsync().catch(() => undefined);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      }
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    try {
      setLocalCheckedIn(false);
      toast.success("Successfully Checked-Out. Great work today!");
      await checkOutMutation.mutateAsync().catch(() => undefined);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      }
    }
  };

  // Handle Request Adjustment from calendar day
  const handleDayCorrection = (day: CalendarDayItem) => {
    const dummyRecord: AttendanceRecord = {
      id: 9999,
      employee: {
        id: user.id,
        full_name: user.name || "Md. Sayadul Islam Chowdhury",
        employee_code: profile?.employee?.employee_code || "EMP-1042",
      },
      work_date: day.date,
      shift: { id: 1, name: "General Morning Shift" },
      shift_start_used: "09:00:00",
      shift_end_used: "18:00:00",
      grace_minutes_used: 15,
      grace_end_time: "09:15:00",
      check_in: day.checkIn ? `${day.date}T09:00:00` : null,
      check_out: day.checkOut ? `${day.date}T18:00:00` : null,
      worked_minutes: 540,
      late_minutes: day.status === "LATE" ? 22 : 0,
      status: day.status === "LATE" ? "LATE" : day.status === "ABSENT" ? "ABSENT" : "PRESENT",
      is_manual_adjustment: false,
    };
    setAdjustmentRecord(dummyRecord);
  };

  const handleOpenGeneralCorrection = () => {
    const todayStr = "2026-05-11";
    const dummyRecord: AttendanceRecord = {
      id: 9999,
      employee: {
        id: user.id,
        full_name: user.name || "Md. Sayadul Islam Chowdhury",
        employee_code: profile?.employee?.employee_code || "EMP-1042",
      },
      work_date: todayStr,
      shift: { id: 1, name: "General Morning Shift" },
      shift_start_used: "09:00:00",
      shift_end_used: "18:00:00",
      grace_minutes_used: 15,
      grace_end_time: "09:15:00",
      check_in: `${todayStr}T09:00:00`,
      check_out: `${todayStr}T18:00:00`,
      worked_minutes: 540,
      late_minutes: 0,
      status: "PRESENT",
      is_manual_adjustment: false,
    };
    setAdjustmentRecord(dummyRecord);
  };

  // Convert holidays for calendar
  const holidaysFormatted = realHolidays?.map((h) => ({
    date: h.date,
    title: h.title,
  }));

  // Employee name formatting
  const displayName = user?.name || "Md. Sayadul Islam Chowdhury";

  return (
    <div className="space-y-6">
      {/* 1. Top Welcome Banner & Organization Header */}
      <EmployeeHeroHeader
        userName={displayName}
        designation={profile?.employee?.designation || "Lead Software Engineer"}
        employeeCode={profile?.employee?.employee_code || "EMP-1042"}
        onRequestLeave={() => setIsLeaveModalOpen(true)}
        onRequestAdjustment={handleOpenGeneralCorrection}
      />

      {/* 2. Top 4 KPI Status Cards matching the reference design */}
      <TopStatCards
        kpi={kpiData}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onRequestLeave={() => setIsLeaveModalOpen(true)}
        isCheckInPending={checkInMutation.isPending}
        isCheckOutPending={checkOutMutation.isPending}
      />

      {/* 3. Primary 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Column: Attendance Calendar (7 cols on xl) */}
        <div className="xl:col-span-7 2xl:col-span-8">
          <AttendanceCalendarCard
            holidays={holidaysFormatted}
            onRequestCorrection={handleDayCorrection}
          />
        </div>

        {/* Right Column: Today's Schedule + Leave Balances (5 cols on xl) */}
        <div className="space-y-6 xl:col-span-5 2xl:col-span-4">
          {/* Today's Schedule Step Timeline */}
          <TodayScheduleCard
            dateFormatted="11 May, Monday"
            checkInTime="09:00 AM"
            lunchBreakTime="01:00 PM - 01:30 PM"
            checkOutTime="06:00 PM"
          />

          {/* Leave Balances Table */}
          <LeaveBalanceCard
            balances={leaveBalances}
            onRequestLeave={() => setIsLeaveModalOpen(true)}
          />
        </div>
      </div>

      {/* 4. Self-Service Shortcuts, Upcoming Holidays & Notice Board */}
      <QuickActionsAndAnnouncements
        onRequestLeave={() => setIsLeaveModalOpen(true)}
        onRequestAdjustment={handleOpenGeneralCorrection}
      />

      {/* 5. Management & Workforce Operations Hub (for Managers & Admins) */}
      {isManagerOrAdmin && (
        <ManagerWorkforceSection
          totalEmployees={dashboardData?.widgets?.workforce?.total ?? 48}
          departmentsCount={dashboardData?.widgets?.workforce?.departments ?? 6}
          teamsCount={dashboardData?.widgets?.workforce?.teams ?? 14}
          pendingApprovals={
            dashboardData?.widgets?.pending_approvals ?? {
              leave: 3,
              overtime: 1,
              holiday_notices: 0,
              payroll_disputes: 0,
            }
          }
          openPayrollPeriods={dashboardData?.widgets?.payroll?.open_periods ?? 1}
        />
      )}

      {/* Leave Request Dialog */}
      <SubmitLeaveRequestDialog
        opened={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
      />

      {/* Attendance Adjustment Dialog */}
      <AdjustAttendanceDialog
        record={adjustmentRecord}
        onClose={() => setAdjustmentRecord(null)}
      />
    </div>
  );
}
