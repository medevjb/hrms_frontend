import type { CurrentUser, PermissionName } from "@/types/auth";

// Display-only (docs/PRD.md §92.1, §11) — hides/shows controls for UX.
// Every real authorization decision happens in a Laravel Policy; a frontend
// permission check that isn't backed by one is a bug, not a shortcut.

export function can(
  permissions: PermissionName[],
  required: PermissionName,
): boolean {
  return permissions.includes(required);
}

export function canAny(
  permissions: PermissionName[],
  required: PermissionName[],
): boolean {
  return required.some((permission) => permissions.includes(permission));
}

export function canAll(
  permissions: PermissionName[],
  required: PermissionName[],
): boolean {
  return required.every((permission) => permissions.includes(permission));
}

// Roles that land on the dashboard chooser and may open the Employee Manage
// Dashboard (docs/PRD.md §8, §74–§78). Exact match against the seeded role
// names. "Team Member" and "System Admin / DevOps" are intentionally absent —
// they go straight to their personal dashboard.
const MANAGEMENT_ROLES = [
  "Admin",
  "Head of HR",
  "HR",
  "Operation Manager",
  "Team Leader",
];

export function isManagementRole(user: Pick<CurrentUser, "roles">): boolean {
  return user.roles.some((role) => MANAGEMENT_ROLES.includes(role));
}
