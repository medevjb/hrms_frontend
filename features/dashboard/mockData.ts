// Shared view-model types for the self dashboard. The data behind them
// comes from live APIs (see SelfDashboard) — there are no fixtures here.

export type CalendarDayStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "OFF"
  | "HOLIDAY"
  | "LEAVE"
  | "MOVEMENT"
  | "HALF_DAY"
  | "NO_RECORD"
  | "PRE_HIRE"
  | "FUTURE";

export type CalendarDayItem = {
  day: number;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun, 6 = Sat
  status: CalendarDayStatus;
  statusLabel?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workedHours?: string | null;
  lateMinutes?: number | null;
  shiftName?: string;
  note?: string;
  isCurrentMonth: boolean;
  isToday?: boolean;
};

export type LeaveBalanceItem = {
  id: string;
  type: string;
  taken: number;
  remaining: number;
  total: number;
  color: string;
};

export type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  type: "CHECK_IN" | "BREAK" | "CHECK_OUT" | "MEETING" | "OVERTIME";
  status: "COMPLETED" | "ACTIVE" | "UPCOMING";
  description?: string;
};

export type DashboardKPI = {
  workingPeriod: {
    startTime: string | null;
    endTime: string | null;
    statusText: string;
    isCheckedIn: boolean;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    workedDuration?: string | null;
  };
  lengthOfService: {
    duration: string | null;
    joiningDate: string | null;
  };
  upcomingLeave: {
    leaveType: string;
    dateFormatted: string;
    status: "APPROVED" | "PENDING";
    daysCount: number;
  } | null;
  attendanceToday: {
    status: string;
    subtext: string;
    tone: "success" | "warning" | "danger" | "info" | "neutral";
  };
};
