"use client";

import { useState } from "react";
import { AlertCircleIcon, CircleCheckIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ApiError } from "@/lib/api-error";
import { useLeaveSettings, useUpdateLeaveSettings } from "@/services/settings";
import type { LeaveSettings } from "@/types/settings";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function Form({ initial }: { initial: LeaveSettings }) {
  const update = useUpdateLeaveSettings();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState(initial);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    try {
      await update.mutateAsync(values);
      setSaved(true);
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
      {saved && (
        <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/10">
          <CircleCheckIcon className="text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-300">Saved.</AlertDescription>
        </Alert>
      )}
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

  return <Form initial={data} />;
}
