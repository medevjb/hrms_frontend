"use client";

import { useState } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useDeactivateLeaveType, useLeaveTypes } from "@/services/leave";
import type { LeaveType } from "@/types/leave";
import { SaveLeaveTypeDialog } from "./SaveLeaveTypeDialog";

export function LeaveTypesManager() {
  const { data: leaveTypes, isLoading } = useLeaveTypes();
  const deactivate = useDeactivateLeaveType();
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<LeaveType | undefined>(undefined);
  const [pendingDeactivate, setPendingDeactivate] = useState<LeaveType | null>(null);

  function openCreate() {
    setEditing(undefined);
    open();
  }

  function openEdit(leaveType: LeaveType) {
    setEditing(leaveType);
    open();
  }

  function confirmDeactivate() {
    if (!pendingDeactivate) return;

    deactivate.mutate(pendingDeactivate.id, {
      onSuccess: () => toast.success("Leave type deactivated"),
      onError: () => toast.error("Deactivation failed"),
      onSettled: () => setPendingDeactivate(null),
    });
  }

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>New leave type</Button>
      </div>

      {!leaveTypes || leaveTypes.length === 0 ? (
        <EmptyState title="No leave types yet" description="Add Casual, Sick, or any other leave type to get started." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Allocation</TableHead>
                <TableHead>Accrual</TableHead>
                <TableHead>Half-day</TableHead>
                <TableHead>Carry forward</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.map((leaveType) => (
                <TableRow key={leaveType.id}>
                  <TableCell>
                    <div className="font-medium">{leaveType.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{leaveType.code}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {leaveType.annual_allocation_days} days{leaveType.is_paid ? "" : " (unpaid)"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{leaveType.accrual_mode === "UPFRONT" ? "Upfront" : "Monthly"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {leaveType.supports_half_day ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {leaveType.carry_forward_enabled
                      ? `Up to ${leaveType.carry_forward_cap_days ?? "org default"}`
                      : "No"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={leaveType.is_active ? "default" : "outline"}>
                      {leaveType.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(leaveType)} aria-label="Edit">
                        <PencilIcon />
                      </Button>
                      {leaveType.is_active && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setPendingDeactivate(leaveType)}
                          aria-label="Deactivate"
                        >
                          <Trash2Icon />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SaveLeaveTypeDialog opened={opened} onClose={close} leaveType={editing} />

      <AlertDialog open={pendingDeactivate !== null} onOpenChange={(open) => !open && setPendingDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {pendingDeactivate?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Existing balances and requests are kept; employees can no longer request this leave type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
