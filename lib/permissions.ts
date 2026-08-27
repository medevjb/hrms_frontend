import type { PermissionName } from "@/types/auth";

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
