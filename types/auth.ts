// Mirrors backend/app/Enums/PermissionName.php and Scope.php (docs/PRD.md §5.3
// requires every backend enum have a matching TS union — keep these in sync
// by hand until there's a generator worth building for a 49-value list).

export type Scope =
  | "SELF"
  | "TEAM"
  | "DEPARTMENT"
  | "OPERATION"
  | "HR_SCOPE"
  | "ALL_EMPLOYEES"
  | "SYSTEM";

export type PermissionName =
  | "employee.view"
  | "employee.create"
  | "employee.update"
  | "employee.archive"
  | "employee.financial.view"
  | "employee.financial.manage"
  | "department.view"
  | "department.manage"
  | "team.view"
  | "team.manage"
  | "shift.view"
  | "shift.manage"
  | "shift.override"
  | "attendance.view"
  | "attendance.manage"
  | "attendance.correct"
  | "leave.request"
  | "leave.review"
  | "leave.approve"
  | "leave.override"
  | "leave.policy.manage"
  | "leave.balance.adjust"
  | "overtime.view"
  | "overtime.review"
  | "overtime.approve"
  | "overtime.adjust"
  | "overtime.policy.manage"
  | "holiday.view"
  | "holiday.manage"
  | "holiday.notice.approve"
  | "announcement.view"
  | "announcement.create"
  | "announcement.publish"
  | "payroll.view"
  | "payroll.prepare"
  | "payroll.adjust"
  | "payroll.finalize"
  | "payroll.dispute.resolve"
  | "payslip.view_self"
  | "payslip.view_all"
  | "report.view"
  | "report.export"
  | "document.view"
  | "document.manage"
  | "settings.manage"
  | "payroll.settings.manage"
  | "attendance.settings.manage"
  | "audit.view"
  | "system.health.view";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  two_factor_enabled: boolean;
  photo_url: string | null;
  roles: string[];
  permissions: PermissionName[];
  // §142 — organization timezone is authoritative for display everywhere,
  // not just evaluation; every session carries it, since most employees
  // don't hold settings.manage to read it from /settings/organization.
  organization: { timezone: string };
};
