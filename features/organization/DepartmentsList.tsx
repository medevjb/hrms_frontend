"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { RowActions } from "@/components/ui/RowActions";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useDeleteDepartment, useDepartments } from "@/services/departments";
import { useDisclosure } from "@/hooks/use-disclosure";
import type { Department } from "@/types/organization";
import { CreateDepartmentModal } from "./CreateDepartmentModal";

export function DepartmentsList() {
  const user = useCurrentUser();
  const canManage = user.permissions.includes("department.manage");
  const { data: departments, isLoading } = useDepartments();
  const deleteDepartment = useDeleteDepartment();
  const [opened, { open, close }] = useDisclosure(false);
  const [pendingDelete, setPendingDelete] = useState<Department | null>(null);

  return (
    <>
      <PageHeader
        title="Departments & Teams"
        description="The organizational hierarchy — departments, their teams, and who leads them."
        actions={
          canManage && (
            <Button onClick={open}>
              <PlusIcon />
              Add department
            </Button>
          )
        }
      />

      {isLoading ? (
        <PageLoadingSkeleton />
      ) : !departments || departments.length === 0 ? (
        <EmptyState
          title="No departments yet"
          description="Create your first department to start building the org chart."
          action={canManage ? { label: "Add department", onClick: open } : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Operation Manager</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>
                    <Link
                      href={`/departments/${department.id}`}
                      className="group flex items-center gap-3 font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 font-bold border border-indigo-500/20">
                        {department.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate group-hover:underline">{department.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {department.operation_manager ? (
                      <div className="flex items-center gap-2">
                        <div className="flex size-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                          {department.operation_manager.full_name.charAt(0)}
                        </div>
                        <span>{department.operation_manager.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip tone={department.active ? "success" : "neutral"}>
                      {department.active ? "Active" : "Inactive"}
                    </StatusChip>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <RowActions
                        viewHref={`/departments/${department.id}`}
                        onDelete={() => setPendingDelete(department)}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateDepartmentModal opened={opened} onClose={close} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => !next && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.name ?? "department"}?`}
        description="This permanently removes the department. It's blocked if the department still has teams — move or delete those first."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteDepartment.mutateAsync(pendingDelete.id);
          toast.success("Department deleted");
        }}
      />
    </>
  );
}
