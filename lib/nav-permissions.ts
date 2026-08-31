import type { PermissionName } from "@/types/auth";

/**
 * Which permission(s) a top-level section needs. The caller needs at least
 * one. Used both to filter the sidebar and to guard direct navigation to a
 * route the user can't act on. Display-only — the API enforces every real
 * check (docs/PRD.md §92.1).
 */
export const SECTION_PERMISSIONS: Record<string, PermissionName[]> = {
  "/employees": ["employee.view"],
  "/departments": ["department.view", "team.view"],
  "/teams": ["department.view", "team.view"],
  "/attendance": ["attendance.view"],
  "/leave": ["leave.request", "leave.review", "leave.approve"],
  "/overtime": ["overtime.view", "overtime.review", "overtime.approve"],
  "/payroll": ["payroll.view", "payslip.view_self"],
  "/shifts": ["shift.view"],
  "/holidays": ["holiday.view"],
  "/announcements": ["announcement.view"],
  "/reports": ["report.view"],
  "/audit": ["audit.view"],
  // System settings is admin-only — the caller needs at least one of the
  // configuration permissions. SystemSettingsPage gates each section
  // further. /account is intentionally absent: every user has one.
  "/settings": [
    "settings.manage",
    "attendance.settings.manage",
    "leave.policy.manage",
    "overtime.policy.manage",
    "payroll.settings.manage",
    "employee.update", // reaches the Weekly offs section only
  ],
};

/** The permissions gating `pathname`, or undefined if it's open to everyone
 *  (the dashboard, and anything not listed above). */
export function permissionsForPath(pathname: string): PermissionName[] | undefined {
  const match = Object.keys(SECTION_PERMISSIONS).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match ? SECTION_PERMISSIONS[match] : undefined;
}
