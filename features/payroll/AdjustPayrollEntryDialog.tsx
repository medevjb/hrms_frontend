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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdjustPayrollEntry } from "@/services/payroll";
import type { PayrollAdjustmentType } from "@/types/payroll";

const TYPES: { value: PayrollAdjustmentType; label: string }[] = [
  { value: "BONUS", label: "Bonus" },
  { value: "ADD_EARNING", label: "Add earning" },
  { value: "ADD_DEDUCTION", label: "Add deduction" },
  { value: "OVERTIME_ADJUSTMENT", label: "Overtime adjustment" },
  { value: "WAIVE_PENALTY", label: "Waive penalty" },
];

function Form({ entryId, onClose }: { entryId: number; onClose: () => void }) {
  const adjust = useAdjustPayrollEntry(entryId);
  const [type, setType] = useState<PayrollAdjustmentType>("BONUS");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    adjust.mutate(
      { type, label, amount, reason },
      {
        onSuccess: () => {
          toast.success("Adjustment applied");
          onClose();
        },
      },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Type">
        <Select value={type} onValueChange={(v) => setType(v as PayrollAdjustmentType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Label" htmlFor="adjustment_label">
        <Input id="adjustment_label" value={label} onChange={(e) => setLabel(e.target.value)} required />
      </FormField>
      <FormField label="Amount" htmlFor="adjustment_amount" description="Positive value">
        <Input
          id="adjustment_amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </FormField>
      <FormField label="Reason" htmlFor="adjustment_reason" description="Required — kept on the audit trail">
        <Textarea
          id="adjustment_reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </FormField>
      <DialogFooter>
        <Button type="submit" disabled={adjust.isPending || !label || !amount || !reason.trim()}>
          Apply
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AdjustPayrollEntryDialog({
  entryId,
  opened,
  onClose,
}: {
  entryId: number;
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payroll adjustment</DialogTitle>
        </DialogHeader>
        {opened && <Form key={entryId} entryId={entryId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
