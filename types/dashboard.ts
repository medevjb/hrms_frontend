// Mirrors backend/app/Services/DashboardService.php (docs/PRD.md §73-§78).

export type DashboardMe = {
  today: {
    status: string;
    check_in: string | null;
    check_out: string | null;
    worked_minutes: number | null;
  } | null;
  leave_balances: { leave_type: string; balance: number }[];
  pending_leave: number;
  overtime_pending: number;
  payslip_awaiting_confirmation: number;
};

export type DashboardAttendanceToday = {
  present: number;
  late: number;
  absent: number;
  on_leave: number;
  missing_checkout: number;
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
    payroll?: DashboardPayroll;
    upcoming_holidays?: { title: string; date: string; type: string }[];
    announcements?: {
      recent: { id: number; title: string; type: string; published_at: string | null }[];
      unread: number;
    };
  };
};
