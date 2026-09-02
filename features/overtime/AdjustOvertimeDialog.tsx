"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdjustOvertime } from "@/services/overtime";
import type { OvertimeRecord } from "@/types/overtime";

function Form({ record, onClose }: { record: OvertimeRecord; onClose: () => void }) {
  const adjust = useAdjustOvertime(record.id);
  const [days, setDays] = useState(String(record.effective_overtime_days));
  const [reason, setReason] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    adjust.mutate(
      { overtime_days: Number(days), reason },
      {
        onSuccess: () => {
          toast.success("Overtime adjusted");
          onClose();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <p className="font-medium">{record.employee.full_name}</p>
        <p className="text-muted-foreground">
          {record.type === "WEEKEND" ? "Weekend" : "Holiday"} overtime · {record.work_date} ·{" "}
          detected {record.overtime_days} day{record.overtime_days === 1 ? "" : "s"}
          {record.rejection_reason ? ` · ${record.rejection_reason}` : ""}
        </p>
      </div>
      <FormField
        label="Overtime days"
        htmlFor="adjust_days"
        description="§68 manual grant — a value above 0 on a rejected record approves it outright."
      >
        <Input
          id="adjust_days"
          type="number"
          min={0}
          max={2}
          step={0.5}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          required
        />
      </FormField>
      <FormField label="Reason" htmlFor="adjust_reason" description="Required">
        <Textarea
          id="adjust_reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </FormField>
      <DialogFooter>
        <Button type="submit" disabled={adjust.isPending || !reason.trim()}>
          Save adjustment
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AdjustOvertimeDialog({
  record,
  onClose,
}: {
  record: OvertimeRecord | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={record !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust overtime</DialogTitle>
        </DialogHeader>
        {record && <Form key={record.id} record={record} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
