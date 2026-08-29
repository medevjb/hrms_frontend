"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useShifts } from "@/services/shifts";
import type { Shift } from "@/types/shifts";
import { SaveShiftModal } from "./SaveShiftModal";

export function ShiftsList() {
  const { data: shifts, isLoading } = useShifts();
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<Shift | undefined>(undefined);

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
          <Button onClick={openCreate}>
            <PlusIcon />
            Add shift
          </Button>
        }
      />

      {isLoading ? (
        <PageLoadingSkeleton />
      ) : !shifts || shifts.length === 0 ? (
        <EmptyState
          title="No shifts yet"
          description="Create a shift so employees can be assigned to it."
          action={{ label: "Add shift", onClick: openCreate }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Expected work</TableHead>
                <TableHead>Late grace</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {shift.start_time}–{shift.end_time}
                    {shift.is_overnight && (
                      <Badge variant="secondary" className="ml-2 align-middle">
                        Overnight
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{shift.expected_work_minutes} min</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {shift.late_grace_minutes === null
                      ? "Organization default"
                      : `${shift.late_grace_minutes} min`}
                  </TableCell>
                  <TableCell>
                    <StatusChip tone={shift.active ? "success" : "neutral"}>
                      {shift.active ? "Active" : "Inactive"}
                    </StatusChip>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(shift)} aria-label="Edit shift">
                      <PencilIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SaveShiftModal opened={opened} onClose={close} shift={editing} />
    </>
  );
}
