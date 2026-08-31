"use client";

import Link from "next/link";
import { ArrowLeftIcon, CheckIcon, ShieldCheckIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { useRole } from "@/services/roles";
import { groupPermissions, permissionActionLabel } from "./permissions";

export function RoleDetail({ roleId }: { roleId: number }) {
  const { data: role, isLoading, isError } = useRole(roleId);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (isError || !role) {
    return (
      <EmptyState
        title="Role not found"
        description="This role doesn't exist, or you don't have access to view it."
      />
    );
  }

  const groups = groupPermissions(role.permissions);

  return (
    <>
      <Link
        href="/roles"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        All roles
      </Link>

      <div className="mb-6 flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600">
          <ShieldCheckIcon className="size-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{role.name}</h1>
          {role.description && (
            <p className="text-sm font-medium text-muted-foreground">{role.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {role.permission_count} {role.permission_count === 1 ? "permission" : "permissions"} ·{" "}
            {role.assigned_user_count} {role.assigned_user_count === 1 ? "person holds" : "people hold"}{" "}
            this role
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState title="No permissions" description="This role carries no permissions." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.key}
              className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs"
            >
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h2>
              <ul className="space-y-1.5">
                {group.permissions.map((permission) => (
                  <li key={permission} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckIcon className="size-3.5 shrink-0 text-emerald-600" />
                    {permissionActionLabel(permission)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
