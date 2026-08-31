import type { PermissionName } from "@/types/auth";

/**
 * Human labels for each permission group's prefix (docs/PRD.md §11). The
 * backend permission strings are `group.action` (or `group.sub.action`) —
 * we split on the first dot to bucket them.
 */
const GROUP_LABELS: Record<string, string> = {
  employee: "Employees",
  department: "Departments",
  team: "Teams",
  shift: "Shifts",
  attendance: "Attendance",
  leave: "Leave",
  overtime: "Overtime",
  holiday: "Holidays",
  announcement: "Announcements",
  payroll: "Payroll",
  payslip: "Payslips",
  report: "Reports",
  document: "Documents",
  settings: "Settings",
  audit: "Audit",
  system: "System",
};

export type PermissionGroup = {
  key: string;
  label: string;
  permissions: PermissionName[];
};

/** Turn a flat permission list into ordered, labelled groups. */
export function groupPermissions(permissions: PermissionName[]): PermissionGroup[] {
  const buckets = new Map<string, PermissionName[]>();

  for (const permission of [...permissions].sort()) {
    const key = permission.split(".")[0];
    const bucket = buckets.get(key) ?? [];
    bucket.push(permission);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .map(([key, perms]) => ({ key, label: GROUP_LABELS[key] ?? key, permissions: perms }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** `employee.financial.view` -> `Financial · View`. */
export function permissionActionLabel(permission: PermissionName): string {
  return permission
    .split(".")
    .slice(1)
    .map((part) => part.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()))
    .join(" · ");
}
