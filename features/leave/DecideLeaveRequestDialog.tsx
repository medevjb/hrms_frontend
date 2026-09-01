"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { toast } from "@/components/ui/toast";
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
import { useApproveLeaveRequest, useDirectApproveLeaveRequest, useRejectLeaveRequest } from "@/services/leave";
import type { LeaveRequest } from "@/types/leave";

export type DecideMode = "approve" | "reject" | "direct-approve";

const COPY: Record<DecideMode, { title: string; reasonRequired: boolean; cta: string }> = {
  approve: { title: "Approve leave request", reasonRequired: false, cta: "Approve" },
  reject: { title: "Reject leave request", reasonRequired: true, cta: "Reject" },
  "direct-approve": {
    title: "Direct approval (§40)",
    reasonRequired: true,
    cta: "Approve directly",
  },
};

function Form({
  leaveRequest,
  mode,
  onClose,
}: {
  leaveRequest: LeaveRequest;
  mode: DecideMode;
  onClose: () => void;
}) {
  const approve = useApproveLeaveRequest(leaveRequest.id);
  const reject = useRejectLeaveRequest(leaveRequest.id);
  const directApprove = useDirectApproveLeaveRequest(leaveRequest.id);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const copy = COPY[mode];
  const pending = approve.isPending || reject.isPending || directApprove.isPending;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      if (mode === "approve") {
        await approve.mutateAsync(reason || undefined);
        toast.success("Approved");
      } else if (mode === "reject") {
        await reject.mutateAsync(reason);
        toast.success("Rejected");
      } else {
        await directApprove.mutateAsync(reason);
        toast.success("Approved directly");
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
        <p className="font-medium">{leaveRequest.employee.full_name}</p>
        <p className="text-muted-foreground">
          {leaveRequest.leave_type.name} · {leaveRequest.start_date}
          {leaveRequest.start_date !== leaveRequest.end_date ? ` – ${leaveRequest.end_date}` : ""} ·{" "}
          {leaveRequest.days_requested} day{leaveRequest.days_requested === 1 ? "" : "s"}
        </p>
        {leaveRequest.reason && <p className="mt-1 text-muted-foreground">&ldquo;{leaveRequest.reason}&rdquo;</p>}
      </div>
      {mode === "direct-approve" && (
        <Alert>
          <AlertCircleIcon />
          <AlertDescription>
            This bypasses every remaining approval stage ({leaveRequest.current_stage}
            {leaveRequest.required_stages.length > 1 ? " and beyond" : ""}) and approves outright.
          </AlertDescription>
        </Alert>
      )}
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

export function DecideLeaveRequestDialog({
  leaveRequest,
  mode,
  onClose,
}: {
  leaveRequest: LeaveRequest | null;
  mode: DecideMode;
  onClose: () => void;
}) {
  return (
    <Dialog open={leaveRequest !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{COPY[mode].title}</DialogTitle>
        </DialogHeader>
        {leaveRequest && <Form key={`${leaveRequest.id}-${mode}`} leaveRequest={leaveRequest} mode={mode} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
