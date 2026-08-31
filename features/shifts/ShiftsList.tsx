"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { RowActions } from "@/components/ui/RowActions";
import { StatusSwitch } from "@/components/ui/StatusSwitch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useDeleteShift, useShifts, useUpdateShift } from "@/services/shifts";
import { apiErrorMessage } from "@/lib/api-error";
import type { Shift } from "@/types/shifts";
import { SaveShiftModal } from "./SaveShiftModal";

function ShiftStatusSwitch({ shift, disabled }: { shift: Shift; disabled?: boolean }) {
  const update = useUpdateShift(shift.id);

  return (
    <StatusSwitch
      checked={shift.active}
      disabled={disabled}
      entityLabel={`the ${shift.name} shift`}
      onConfirm={async (next) => {
        try {
          await update.mutateAsync({ active: next });
          toast.success(next ? "Shift activated" : "Shift deactivated");
        } catch (caught) {
          toast.error(apiErrorMessage(caught, "Could not update the shift"));
        }
      }}
    />
  );
}

export function ShiftsList() {
  const user = useCurrentUser();
  const canManage = user.permissions.includes("shift.manage");
  const { data: shifts, isLoading } = useShifts();
  const deleteShift = useDeleteShift();
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<Shift | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Shift | null>(null);

  function openCreate() {
    setEditing(undefined);
    open();
  }

  function openEdit(shift: Shift) {
    setEditing(shift);
    open();
  }

  return (
    <>
      <PageHeader
        title="Shifts"
        description="The shift catalogue — start/end times, expected hours, and any shift-specific late grace override."
        actions={
          canManage && (
            <Button onClick={openCreate}>
              <PlusIcon />
              Add shift
            </Button>
          )
        }
      />

      {isLoading ? (
        <PageLoadingSkeleton />
      ) : !shifts || shifts.length === 0 ? (
        <EmptyState
          title="No shifts yet"
          description="Create a shift so employees can be assigned to it."
          action={canManage ? { label: "Add shift", onClick: openCreate } : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift Name</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Break</TableHead>
                <TableHead>Expected work</TableHead>
                <TableHead>Late grace</TableHead>
                <TableHead>Active</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-bold text-foreground">{shift.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-mono font-bold text-primary">
                      {shift.start_time} – {shift.end_time}
                    </span>
                    {shift.is_overnight && (
                      <Badge variant="secondary" className="ml-2 align-middle">
                        Overnight
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {shift.break_start && shift.break_end
                      ? `${shift.break_start}–${shift.break_end}`
                      : shift.break_minutes > 0
                        ? `${shift.break_minutes} min`
                        : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{shift.expected_work_minutes} min</TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {shift.late_grace_minutes === null
                      ? "Organization default"
                      : `${shift.late_grace_minutes} min`}
                  </TableCell>
                  <TableCell>
                    <ShiftStatusSwitch shift={shift} disabled={!canManage} />
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <RowActions
                        onEdit={() => openEdit(shift)}
                        onDelete={() => setPendingDelete(shift)}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SaveShiftModal opened={opened} onClose={close} shift={editing} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => !next && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.name ?? "shift"}?`}
        description="This permanently removes the shift. It's blocked if the shift is assigned to anyone or referenced by attendance history — deactivate it instead."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteShift.mutateAsync(pendingDelete.id);
            toast.success("Shift deleted");
          } catch (caught) {
            toast.error(apiErrorMessage(caught, "Could not delete shift"));
          }
        }}
      />
    </>
  );
}
