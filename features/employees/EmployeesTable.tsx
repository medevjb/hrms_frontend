"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { BulkBar } from "@/components/ui/BulkBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { RowActions } from "@/components/ui/RowActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useRowSelection } from "@/hooks/use-row-selection";
import { apiErrorMessage } from "@/lib/api-error";
import { useDeleteEmployee, useEmployees } from "@/services/employees";
import type { EmployeeStatus } from "@/types/organization";
import { ChangeEmployeeStatusDialog } from "./ChangeEmployeeStatusDialog";
import { EmployeeStatusBadge } from "./EmployeeStatusBadge";

const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "INVITED", label: "Invited" },
  { value: "ACTIVE", label: "Active" },
  { value: "PROBATION", label: "Probation" },
  { value: "NOTICE_PERIOD", label: "Notice period" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "ARCHIVED", label: "Archived" },
];

export function EmployeesTable() {
  const user = useCurrentUser();
  const canUpdate = user.permissions.includes("employee.update");
  const canArchive = user.permissions.includes("employee.archive");
  const selectable = canUpdate || canArchive;

  const [status, setStatus] = useState<EmployeeStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusTarget, setStatusTarget] = useState<number[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ ids: number[]; label: string } | null>(null);

  const { data, isLoading } = useEmployees({ status: status === "all" ? undefined : status, page });
  const deleteEmployee = useDeleteEmployee();

  const employees = useMemo(
    () =>
      (data?.data ?? []).filter((employee) =>
        search.trim() === ""
          ? true
          : employee.full_name.toLowerCase().includes(search.toLowerCase()) ||
            employee.employee_code.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  );

  const selection = useRowSelection(employees, (employee) => employee.id);
  const allSelectedInvited =
    selection.count > 0 && selection.selected.every((employee) => employee.status === "INVITED");

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-64">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or code"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as EmployeeStatus | "all");
            setPage(1);
            selection.clear();
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectable && (
        <BulkBar count={selection.count} onClear={selection.clear}>
          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusTarget(selection.selected.map((employee) => employee.id))}
            >
              Change status
            </Button>
          )}
          {canArchive && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={!allSelectedInvited}
              title={
                allSelectedInvited
                  ? undefined
                  : "Only invited employees who never onboarded can be deleted"
              }
              onClick={() => {
                const ids = selection.selected.map((employee) => employee.id);
                setPendingDelete({ ids, label: `${ids.length} invited employees` });
              }}
            >
              Delete
            </Button>
          )}
        </BulkBar>
      )}

      {employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Invite your first employee to get started."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  {selectable && (
                    <TableHead className="w-10">
                      <Checkbox
                        aria-label="Select all"
                        checked={
                          selection.allSelected
                            ? true
                            : selection.someSelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={() => selection.toggleAll()}
                      />
                    </TableHead>
                  )}
                  <TableHead>Employee</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  {selectable && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} data-state={selection.isSelected(employee.id) ? "selected" : undefined}>
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          aria-label={`Select ${employee.full_name}`}
                          checked={selection.isSelected(employee.id)}
                          onCheckedChange={() => selection.toggle(employee.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Link href={`/employees/${employee.id}`} className="group flex items-center gap-3 font-semibold text-foreground hover:text-primary transition-colors">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/20">
                          {employee.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate group-hover:underline">{employee.full_name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <span className="inline-flex rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
                        {employee.employee_code}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{employee.designation}</TableCell>
                    <TableCell className="text-muted-foreground">{employee.department?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{employee.team?.name ?? "—"}</TableCell>
                    <TableCell>
                      <EmployeeStatusBadge status={employee.status} />
                    </TableCell>
                    {selectable && (
                      <TableCell className="text-right">
                        <RowActions
                          viewHref={`/employees/${employee.id}`}
                          onEdit={canUpdate ? () => setStatusTarget([employee.id]) : undefined}
                          onDelete={
                            canArchive && employee.status === "INVITED"
                              ? () =>
                                  setPendingDelete({ ids: [employee.id], label: employee.full_name })
                              : undefined
                          }
                          deleteTitle="Delete this invited employee"
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data && data.meta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeftIcon />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.meta.current_page} of {data.meta.last_page}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))}
                disabled={page >= data.meta.last_page}
                aria-label="Next page"
              >
                <ChevronRightIcon />
              </Button>
            </div>
          )}
        </>
      )}

      <ChangeEmployeeStatusDialog
        employeeIds={statusTarget ?? []}
        open={statusTarget !== null}
        onClose={() => setStatusTarget(null)}
        onDone={() => selection.clear()}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => !next && setPendingDelete(null)}
        title={
          (pendingDelete?.ids.length ?? 0) > 1 ? "Delete invited employees?" : "Delete invited employee?"
        }
        description={`Permanently removes ${pendingDelete?.label ?? "this person"} and the paired pending user account${
          (pendingDelete?.ids.length ?? 0) > 1 ? "s" : ""
        }. This is only for an invite created by mistake — it's blocked once anyone has any history.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          const ids = pendingDelete?.ids ?? [];
          const results = await Promise.allSettled(ids.map((id) => deleteEmployee.mutateAsync(id)));
          const failed = results.filter((r) => r.status === "rejected");
          const ok = results.length - failed.length;
          if (ok > 0) toast.success(`${ok} employee${ok === 1 ? "" : "s"} deleted`);
          if (failed.length > 0) {
            const first = failed[0] as PromiseRejectedResult;
            toast.error(apiErrorMessage(first.reason, "Could not delete"));
          }
          selection.clear();
        }}
      />
    </>
  );
}
