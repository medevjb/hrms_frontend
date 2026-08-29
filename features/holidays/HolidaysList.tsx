"use client";

import { useState } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
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
import { StatusChip } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useDeleteHoliday, useHolidays } from "@/services/holidays";
import type { Holiday } from "@/types/holidays";
import { SaveHolidayModal } from "./SaveHolidayModal";

const TYPE_VARIANT: Record<Holiday["type"], "default" | "secondary" | "outline"> = {
  NATIONAL: "default",
  RELIGIOUS: "secondary",
  COMPANY: "outline",
  OTHER: "outline",
};

export function HolidaysList() {
  const { data: holidays, isLoading } = useHolidays();
  const deleteHoliday = useDeleteHoliday();
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<Holiday | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Holiday | null>(null);

  function openEdit(holiday: Holiday) {
    setEditing(holiday);
    open();
  }

  function confirmDelete() {
    if (!pendingDelete) return;

    deleteHoliday.mutate(pendingDelete.id, {
      onSuccess: () => toast.success("Holiday deleted"),
      onError: () => toast.error("Delete failed"),
      onSettled: () => setPendingDelete(null),
    });
  }

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <>
      {!holidays || holidays.length === 0 ? (
        <EmptyState title="No holidays yet" description="Add the first holiday to the calendar." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-medium">{holiday.title}</TableCell>
                  <TableCell className="font-mono text-sm">{holiday.date}</TableCell>
                  <TableCell>
                    <Badge variant={TYPE_VARIANT[holiday.type]}>{holiday.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusChip tone={holiday.active ? "success" : "neutral"}>
                      {holiday.active ? "Active" : "Inactive"}
                    </StatusChip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(holiday)} aria-label="Edit holiday">
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setPendingDelete(holiday)}
                        aria-label="Delete holiday"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SaveHolidayModal opened={opened} onClose={close} holiday={editing} />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {pendingDelete?.title} from the holiday calendar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
