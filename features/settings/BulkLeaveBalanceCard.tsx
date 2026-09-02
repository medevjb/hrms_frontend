"use client";

import { useState } from "react";
import { UsersIcon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsCard } from "@/components/ui/SettingsCard";
import { Textarea } from "@/components/ui/textarea";
import { useBulkAdjustLeaveBalances, useLeaveTypes } from "@/services/leave";
import type { BulkLeaveBalanceMode } from "@/types/leave";

const MODES: { value: BulkLeaveBalanceMode; label: string; help: string }[] = [
  { value: "GRANT", label: "Grant days", help: "Add (or, with a negative number, remove) days from everyone's current balance." },
  { value: "SET", label: "Set balance to", help: "Move everyone's balance to exactly this number of days." },
  { value: "REAPPLY_DEFAULT", label: "Reset to the type's allocation", help: "Move everyone's balance back to this leave type's default annual allocation." },
];

export function BulkLeaveBalanceCard() {
  const { data: leaveTypes, isLoading } = useLeaveTypes();
  const bulk = useBulkAdjustLeaveBalances();

  const [leaveTypeId, setLeaveTypeId] = useState<string>("");
  const [mode, setMode] = useState<BulkLeaveBalanceMode>("GRANT");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  const activeTypes = (leaveTypes ?? []).filter((type) => type.is_active);
  const selectedType = activeTypes.find((type) => String(type.id) === leaveTypeId);
  const needsAmount = mode === "GRANT" || mode === "SET";
  const parsedAmount = Number(amount);
  const amountValid = !needsAmount || (amount.trim() !== "" && Number.isFinite(parsedAmount));
  const canSubmit = Boolean(leaveTypeId) && amountValid && note.trim() !== "";

  async function apply() {
    // A rejection propagates so ConfirmDialog stays open; the failure toast
    // is fired by the global mutation handler.
    const result = await bulk.mutateAsync({
      leave_type_id: Number(leaveTypeId),
      mode,
      amount: needsAmount ? parsedAmount : undefined,
      note: note.trim(),
    });
    toast.success(
      result.affected === 0
        ? "Everyone was already on that balance — nothing changed."
        : `Updated ${result.affected} employee${result.affected === 1 ? "" : "s"}.`,
    );
    setAmount("");
    setNote("");
  }

  const summary = selectedType
    ? mode === "GRANT"
      ? `${parsedAmount >= 0 ? "Add" : "Remove"} ${Math.abs(parsedAmount || 0)} day(s) ${parsedAmount >= 0 ? "to" : "from"} every active employee's ${selectedType.name} balance.`
      : mode === "SET"
        ? `Set every active employee's ${selectedType.name} balance to ${parsedAmount || 0} days.`
        : `Reset every active employee's ${selectedType.name} balance to the default ${selectedType.annual_allocation_days} days.`
    : "";

  return (
    <SettingsCard
      title="Apply a balance to everyone"
      description="A one-shot leave-balance change for the whole active workforce. Each employee gets their own audit entry, so it can be undone per person."
    >
      <div className="space-y-4">
        <FormField label="Leave type">
          <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pick a leave type" />
            </SelectTrigger>
            <SelectContent>
              {activeTypes.map((type) => (
                <SelectItem key={type.id} value={String(type.id)}>
                  {type.name} · {type.annual_allocation_days} days default
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Action" description={MODES.find((m) => m.value === mode)?.help}>
          <Select value={mode} onValueChange={(v) => setMode(v as BulkLeaveBalanceMode)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {needsAmount && (
          <FormField label={mode === "GRANT" ? "Days to grant" : "Target balance (days)"} htmlFor="bulk_amount">
            <Input
              id="bulk_amount"
              type="number"
              step="0.5"
              min={mode === "SET" ? 0 : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={mode === "GRANT" ? "e.g. 2 or -1" : "e.g. 20"}
            />
          </FormField>
        )}

        <FormField label="Reason" htmlFor="bulk_note" description="Recorded on every employee's balance history.">
          <Textarea
            id="bulk_note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Annual leave policy increased to 22 days for 2026"
          />
        </FormField>

        <Button type="button" disabled={!canSubmit || bulk.isPending} onClick={() => setConfirmOpen(true)}>
          <UsersIcon />
          Apply to all employees
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Apply to every active employee?"
        description={summary}
        confirmLabel="Apply"
        onConfirm={apply}
      />
    </SettingsCard>
  );
}
