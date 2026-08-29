"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-error";
import { useApproveOvertime, useRejectOvertime } from "@/services/overtime";
import type { OvertimeRecord } from "@/types/overtime";

export type DecideMode = "approve" | "reject";

const COPY: Record<DecideMode, { title: string; reasonRequired: boolean; cta: string }> = {
  approve: { title: "Approve overtime", reasonRequired: false, cta: "Approve" },
  reject: { title: "Reject overtime", reasonRequired: true, cta: "Reject" },
};

function Form({
  record,
  mode,
  onClose,
}: {
  record: OvertimeRecord;
  mode: DecideMode;
  onClose: () => void;
}) {
  const approve = useApproveOvertime(record.id);
  const reject = useRejectOvertime(record.id);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const copy = COPY[mode];
  const pending = approve.isPending || reject.isPending;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      if (mode === "approve") {
        await approve.mutateAsync(reason || undefined);
        toast.success("Approved");
      } else {
        await reject.mutateAsync(reason);
        toast.success("Rejected");
      }
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <p className="font-medium">{record.employee.full_name}</p>
        <p className="text-muted-foreground">
          {record.type === "WEEKEND" ? "Weekend" : "Holiday"} overtime · {record.work_date} ·{" "}
          {(record.worked_minutes / 60).toFixed(1)}h worked · {record.effective_overtime_days} day
          {record.effective_overtime_days === 1 ? "" : "s"}
        </p>
      </div>
      <FormField
        label="Reason"
        htmlFor="decide_reason"
        description={copy.reasonRequired ? "Required" : "Optional"}
      >
        <Textarea
          id="decide_reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required={copy.reasonRequired}
        />
      </FormField>
      <DialogFooter>
        <Button
          type="submit"
          variant={mode === "reject" ? "destructive" : "default"}
          disabled={pending || (copy.reasonRequired && !reason.trim())}
        >
          {copy.cta}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DecideOvertimeDialog({
  record,
  mode,
  onClose,
}: {
  record: OvertimeRecord | null;
  mode: DecideMode;
  onClose: () => void;
}) {
  return (
    <Dialog open={record !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{COPY[mode].title}</DialogTitle>
        </DialogHeader>
        {record && <Form key={`${record.id}-${mode}`} record={record} mode={mode} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
