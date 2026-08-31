// Mirrors backend/app/Services/DashboardService.php (docs/PRD.md §73-§78).

export type DashboardLeaveBalance = {
  leave_type: string;
  balance: number;
  entitlement: number;
  taken: number;
};

export type DashboardNextLeave = {
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
};

export type DashboardMe = {
  today: {
    status: string;
    check_in: string | null;
    check_out: string | null;
    worked_minutes: number | null;
  } | null;
  leave_balances: DashboardLeaveBalance[];
  // The employee's effective weekly-off day names, lowercase (e.g. ["friday"]).
  weekend_days: string[];
  next_approved_leave: DashboardNextLeave | null;
  pending_leave: number;
  overtime_pending: number;
  payslip_awaiting_confirmation: number;
};

export type DashboardOnLeave = {
  employee_id: number;
  name: string;
  leave_type: string;
  until: string;
};

export type DashboardAttendanceToday = {
  present: number;
  late: number;
  absent: number;
  on_leave: number;
  missing_checkout: number;
  on_leave_today: DashboardOnLeave[];
  on_leave_upcoming: DashboardOnLeave[];
};

export type DashboardPendingApprovals = {
  leave?: number;
  overtime?: number;
  holiday_notices?: number;
  payroll_disputes?: number;
};

export type DashboardWorkforce = {
  total: number;
  active: number;
  by_status: Record<string, number>;
  departments: number;
  teams: number;
  by_department: { id: number; name: string; headcount: number }[];
};

export type DashboardPeopleMovement = {
  recent_joiners: {
    employee_id: number;
    name: string;
    designation: string;
    joining_date: string;
  }[];
  recent_exits: {
    employee_id: number;
    name: string;
    designation: string;
    status: string;
  }[];
};

export type DashboardPayroll = {
  current_period: {
    id: number;
    label: string;
    status: string;
    entries: number;
    awaiting_confirmation: number;
  } | null;
  open_periods: number;
};

export type DashboardPayload = {
  as_of: string;
  roles: string[];
  widgets: {
    me?: DashboardMe;
    attendance_today?: DashboardAttendanceToday;
    pending_approvals?: DashboardPendingApprovals;
    workforce?: DashboardWorkforce;
    people_movement?: DashboardPeopleMovement;
    payroll?: DashboardPayroll;
    upcoming_holidays?: { title: string; date: string; type: string }[];
    announcements?: {
      recent: { id: number; title: string; type: string; published_at: string | null }[];
      unread: number;
    };
  };
};
