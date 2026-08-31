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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-error";
import { useAdjustLeaveBalance } from "@/services/leave";
import type { LeaveBalance } from "@/types/leave";

function Form({ balance, onClose }: { balance: LeaveBalance; onClose: () => void }) {
  const adjust = useAdjustLeaveBalance(balance.id);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const parsed = Number(amount);
  const valid = amount.trim() !== "" && Number.isFinite(parsed) && parsed !== 0 && note.trim() !== "";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!valid) return;

    try {
      await adjust.mutateAsync({ amount: parsed, note: note.trim() });
      toast.success("Balance adjusted");
      onClose();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(
          Object.fromEntries(Object.entries(caught.errors ?? {}).map(([f, m]) => [f, m[0]])),
        );
        setError(caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
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
        <p className="font-medium">{balance.leave_type.name}</p>
        <p className="text-muted-foreground">
          {balance.leave_year} · current balance {balance.balance} days
        </p>
      </div>

      <FormField
        label="Adjustment (days)"
        htmlFor="adjust_amount"
        description="Positive to grant days, negative to deduct."
        error={fieldErrors.amount}
      >
        <Input
          id="adjust_amount"
          type="number"
          step="0.5"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 2 or -1"
        />
      </FormField>

      {valid && (
        <p className="text-sm text-muted-foreground">
          New balance:{" "}
          <span className="font-medium text-foreground">{balance.balance + parsed} days</span>
        </p>
      )}

      <FormField label="Reason" htmlFor="adjust_note" description="Required — recorded in the audit log." error={fieldErrors.note}>
        <Textarea id="adjust_note" value={note} onChange={(e) => setNote(e.target.value)} required />
      </FormField>

      <DialogFooter>
        <Button type="submit" disabled={adjust.isPending || !valid}>
          Apply adjustment
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AdjustLeaveBalanceDialog({
  balance,
  onClose,
}: {
  balance: LeaveBalance | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={balance !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust leave balance</DialogTitle>
        </DialogHeader>
        {balance && <Form key={balance.id} balance={balance} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
