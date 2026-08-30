"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { runBulk } from "@/components/ui/BulkBar";
import { apiErrorMessage } from "@/lib/api-error";
import { useChangeEmployeeStatus } from "@/services/employees";
import type { EmployeeStatus } from "@/types/organization";

const OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "PROBATION", label: "Probation" },
  { value: "NOTICE_PERIOD", label: "Notice period" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "ARCHIVED", label: "Archived" },
];

/**
 * Changes employee status for one row or a whole selection. A bulk run
 * tolerates per-row rejections (an illegal transition for one employee
 * doesn't block the rest) and reports a summary.
 */
export function ChangeEmployeeStatusDialog({
  employeeIds,
  open,
  onClose,
  onDone,
}: {
  employeeIds: number[];
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const change = useChangeEmployeeStatus();
  const [status, setStatus] = useState<EmployeeStatus>("ACTIVE");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const count = employeeIds.length;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (count === 1) {
      try {
        await change.mutateAsync({ id: employeeIds[0], status, reason });
        toast.success("Status updated");
        finish();
      } catch (caught) {
        setError(apiErrorMessage(caught, "Could not update status"));
      }
      return;
    }

    const { ok, failed } = await runBulk(employeeIds, (id) =>
      change.mutateAsync({ id, status, reason }),
    );
    if (ok > 0) toast.success(`${ok} employee${ok === 1 ? "" : "s"} updated`);
    if (failed > 0) toast.error(`${failed} could not be changed (illegal transition)`);
    finish();
  }

  function finish() {
    setReason("");
    setError(null);
    onDone?.();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {count > 1 ? `Change status for ${count} employees` : "Change employee status"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <FormField label="New status">
            <Select value={status} onValueChange={(v) => setStatus(v as EmployeeStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Reason" description="Kept on the status history and audit trail">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
          </FormField>
          <DialogFooter>
            <Button type="submit" disabled={change.isPending || !reason.trim()}>
              Update status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
