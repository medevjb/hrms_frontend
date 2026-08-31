"use client";

import { useState } from "react";
import { AlertCircleIcon, CircleCheckIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { SettingsCard } from "@/components/ui/SettingsCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api-error";
import { usePayrollSettings, useUpdatePayrollSettings } from "@/services/settings";
import type { PayrollSettings, SalaryDayCalculationMethod } from "@/types/settings";
import { LatePenaltyRulesCard } from "./LatePenaltyRulesCard";
import { SalaryComponentsCard } from "./SalaryComponentsCard";

const TOGGLES: { key: keyof PayrollSettings; label: string }[] = [
  { key: "late_penalty_enabled", label: "Apply late penalties" },
  { key: "absence_deduction_enabled", label: "Deduct unauthorised absence" },
  { key: "unpaid_leave_deduction_enabled", label: "Deduct unpaid leave" },
  { key: "overtime_earnings_enabled", label: "Pay approved overtime" },
];

const CALCULATION_METHODS: { value: SalaryDayCalculationMethod; label: string }[] = [
  { value: "FIXED_30_DAYS", label: "Fixed 30 days" },
  { value: "CALENDAR_DAYS", label: "Calendar days in the month" },
  { value: "WORKING_DAYS", label: "Working days in the month" },
];

function Form({ initial }: { initial: PayrollSettings }) {
  const update = useUpdatePayrollSettings();
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
    <SettingsCard title="Payroll rules">
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
        label="Payroll cutoff day"
        htmlFor="payroll_cutoff_day"
        description="Leave blank for a standard 1st-to-month-end period"
      >
        <Input
          id="payroll_cutoff_day"
          type="number"
          min={1}
          max={28}
          value={values.payroll_cutoff_day ?? ""}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              payroll_cutoff_day: e.target.value === "" ? null : Number(e.target.value),
            }))
          }
        />
      </FormField>
      <FormField label="Salary day calculation method">
        <Select
          value={values.salary_day_calculation_method}
          onValueChange={(v) =>
            setValues((cur) => ({ ...cur, salary_day_calculation_method: v as SalaryDayCalculationMethod }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CALCULATION_METHODS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField
        label="Dispute window (days)"
        htmlFor="dispute_window_days"
        description="How long an employee has to raise a payroll dispute after release (§147)"
      >
        <Input
          id="dispute_window_days"
          type="number"
          min={1}
          max={60}
          value={values.dispute_window_days}
          onChange={(e) => setValues((v) => ({ ...v, dispute_window_days: Number(e.target.value) }))}
        />
      </FormField>

      <div className="space-y-3 border-t border-border pt-4">
        {TOGGLES.map((toggle) => (
          <div key={toggle.key} className="flex items-center justify-between">
            <label htmlFor={toggle.key} className="text-sm font-medium">
              {toggle.label}
            </label>
            <Switch
              id={toggle.key}
              checked={Boolean(values[toggle.key])}
              onCheckedChange={(checked) => setValues((v) => ({ ...v, [toggle.key]: checked }))}
            />
          </div>
        ))}
      </div>

        <Button type="submit" disabled={update.isPending}>
          Save payroll settings
        </Button>
      </form>
    </SettingsCard>
  );
}

export function PayrollSettingsTab() {
  const { data, isLoading } = usePayrollSettings();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return (
    <div className="space-y-8">
      <Form initial={data} />
      <LatePenaltyRulesCard />
      <SalaryComponentsCard />
    </div>
  );
}
