// Mirrors backend/app/Models/Role + RoleResource. The V1 role catalogue is
// fixed (docs/PRD.md §8) and seeded, not authored in the app — this module is
// a read-only reference map of who can do what.

import type { PermissionName } from "@/types/auth";

export type Role = {
  id: number;
  name: string;
  description: string | null;
  permissions: PermissionName[];
  permission_count: number;
  assigned_user_count: number;
};
