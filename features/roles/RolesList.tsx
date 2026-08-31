"use client";

import Link from "next/link";
import { ChevronRightIcon, ShieldCheckIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoles } from "@/services/roles";

export function RolesList() {
  const { data: roles, isLoading, isError } = useRoles();

  return (
    <>
      <PageHeader
        title="Roles"
        description="The fixed set of roles employees can hold, and the permissions each one carries. Assign roles to people from their profile."
      />

      {isLoading ? (
        <PageLoadingSkeleton />
      ) : isError || !roles ? (
        <EmptyState
          title="Couldn't load roles"
          description="Something went wrong fetching the role catalogue. Try refreshing the page."
        />
      ) : roles.length === 0 ? (
        <EmptyState title="No roles defined" description="The role catalogue is empty." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>People</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} className="group">
                  <TableCell>
                    <Link href={`/roles/${role.id}`} className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600">
                        <ShieldCheckIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground group-hover:text-primary group-hover:underline">
                          {role.name}
                        </p>
                        {role.description && (
                          <p className="truncate text-xs text-muted-foreground">{role.description}</p>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.permission_count} {role.permission_count === 1 ? "permission" : "permissions"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.assigned_user_count} assigned
                  </TableCell>
                  <TableCell>
                    <ChevronRightIcon className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
