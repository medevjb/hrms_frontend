export type CalendarDayStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "OFF"
  | "HOLIDAY"
  | "LEAVE"
  | "MOVEMENT"
  | "HALF_DAY"
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
    startTime: string;
    endTime: string;
    statusText: string;
    isCheckedIn: boolean;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    workedDuration?: string | null;
  };
  lengthOfService: {
    duration: string; // e.g. "10 months 26 days"
    joiningDate: string; // e.g. "15 Jun, 2025"
  };
  upcomingLeave: {
    leaveType: string;
    dateFormatted: string; // e.g. "02 May, 2026 (01:31 PM)"
    status: "APPROVED" | "PENDING";
    daysCount: number;
  };
  attendanceToday: {
    status: "Present" | "Late" | "Absent" | "On Leave" | "Not Checked In";
    subtext: string;
    tone: "success" | "warning" | "danger" | "info" | "neutral";
  };
};

export const MOCK_DASHBOARD_KPI: DashboardKPI = {
  workingPeriod: {
    startTime: "09:00 AM",
    endTime: "06:00 PM",
    statusText: "Please check-in",
    isCheckedIn: false,
    checkInTime: null,
    checkOutTime: null,
    workedDuration: null,
  },
  lengthOfService: {
    duration: "10 months 26 days",
    joiningDate: "15 Jun, 2025",
  },
  upcomingLeave: {
    leaveType: "Casual Leave",
    dateFormatted: "02 May, 2026 (01:31 PM)",
    status: "APPROVED",
    daysCount: 1,
  },
  attendanceToday: {
    status: "Present",
    subtext: "On Time (09:00 AM)",
    tone: "success",
  },
};

export const MOCK_LEAVE_BALANCES: LeaveBalanceItem[] = [
  {
    id: "1",
    type: "Sick Leave",
    taken: 5,
    remaining: 9,
    total: 14,
    color: "bg-emerald-500",
  },
  {
    id: "2",
    type: "Casual Leave",
    taken: 1,
    remaining: 9,
    total: 10,
    color: "bg-indigo-500",
  },
  {
    id: "3",
    type: "Earned / Annual Leave",
    taken: 3,
    remaining: 12,
    total: 15,
    color: "bg-violet-500",
  },
];

export const MOCK_SCHEDULE_TIMELINE: ScheduleItem[] = [
  {
    id: "sch-1",
    time: "09:00 AM",
    title: "Check-In",
    type: "CHECK_IN",
    status: "COMPLETED",
    description: "Shift Started • General Morning Shift (09:00 AM - 06:00 PM)",
  },
  {
    id: "sch-2",
    time: "01:00 PM - 01:30 PM",
    title: "Lunch Break",
    type: "BREAK",
    status: "ACTIVE",
    description: "30 mins standard dining & rest period",
  },
  {
    id: "sch-3",
    time: "06:00 PM",
    title: "Check-Out",
    type: "CHECK_OUT",
    status: "UPCOMING",
    description: "Regular Shift Conclusion & Overtime Logging",
  },
];

export const MOCK_ANNOUNCEMENTS = [
  {
    id: 1,
    title: "Annual Company Retreat 2026: Registration Now Open",
    date: "28 Apr, 2026",
    type: "GENERAL",
    tag: "Event",
    unread: true,
  },
  {
    id: 2,
    title: "Revised Q2 Health & Wellness Policy Guidelines",
    date: "20 Apr, 2026",
    type: "URGENT",
    tag: "Policy",
    unread: false,
  },
  {
    id: 3,
    title: "Public Holiday Notice: Buddha Purnima & May Day",
    date: "15 Apr, 2026",
    type: "INFO",
    tag: "Holiday",
    unread: false,
  },
];

export const MOCK_UPCOMING_HOLIDAYS = [
  {
    id: 1,
    title: "Buddha Purnima",
    date: "2026-05-26",
    dayName: "Tuesday",
    type: "PUBLIC_HOLIDAY",
  },
  {
    id: 2,
    title: "National Holiday",
    date: "2026-05-27",
    dayName: "Wednesday",
    type: "PUBLIC_HOLIDAY",
  },
  {
    id: 3,
    title: "Cultural Festival",
    date: "2026-05-28",
    dayName: "Thursday",
    type: "PUBLIC_HOLIDAY",
  },
];
