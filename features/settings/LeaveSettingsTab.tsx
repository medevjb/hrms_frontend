"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/toast";
import { LeaveTypesManager } from "@/features/leave/LeaveTypesManager";
import { useLeaveSettings, useUpdateLeaveSettings } from "@/services/settings";
import type { LeaveSettings } from "@/types/settings";
import { BulkLeaveBalanceCard } from "./BulkLeaveBalanceCard";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function Form({ initial }: { initial: LeaveSettings }) {
  const update = useUpdateLeaveSettings();
  const [values, setValues] = useState(initial);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    update.mutate(values, {
      onSuccess: () => toast.success("Leave settings saved"),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Leave year start month"
        description="§144 — accrual, carry-forward, and expiry all anchor to this date each year"
      >
        <Select
          value={String(values.leave_year_start_month)}
          onValueChange={(v) => setValues((cur) => ({ ...cur, leave_year_start_month: Number(v) }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month, index) => (
              <SelectItem key={month} value={String(index + 1)}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField
        label="Default carry-forward cap (days)"
        htmlFor="leave_carry_forward_cap_days"
        description="Used by any leave type that enables carry-forward without its own cap. Leave blank for no cap."
      >
        <Input
          id="leave_carry_forward_cap_days"
          type="number"
          min={0}
          value={values.leave_carry_forward_cap_days ?? ""}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              leave_carry_forward_cap_days: e.target.value === "" ? null : Number(e.target.value),
            }))
          }
        />
      </FormField>
      <Button type="submit" disabled={update.isPending}>
        Save leave settings
      </Button>
    </form>
  );
}

export function LeaveSettingsTab() {
  const { data, isLoading } = useLeaveSettings();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Leave year"
        description="When the leave year starts and how much unused balance can carry into the next one."
      >
        <Form initial={data} />
      </SettingsCard>

      <SettingsCard
        title="Leave categories"
        description="The catalogue every employee picks from when requesting time off — each type's default annual allocation, accrual, half-day and carry-forward rules."
      >
        <LeaveTypesManager />
      </SettingsCard>

      <BulkLeaveBalanceCard />
    </div>
  );
}
