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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { useOvertimeSettings, useUpdateOvertimeSettings } from "@/services/settings";
import type {
  OvertimeDailySalaryBasis,
  OvertimeHourlyRateMode,
  OvertimeSettings,
} from "@/types/settings";

const SALARY_BASIS: { value: OvertimeDailySalaryBasis; label: string }[] = [
  { value: "BASIC", label: "Basic salary" },
  { value: "GROSS", label: "Gross salary" },
];

const RATE_MODES: { value: OvertimeHourlyRateMode; label: string }[] = [
  { value: "FIXED", label: "Fixed hourly rate" },
  { value: "SALARY_DERIVED", label: "Derived from salary" },
];

function ToggleRow({
  id,
  label,
  checked,
  onChange,
  description,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {description && <span className="ml-1.5 font-normal text-muted-foreground">— {description}</span>}
      </label>
    </div>
  );
}

function Form({ initial }: { initial: OvertimeSettings }) {
  const update = useUpdateOvertimeSettings();
  const [values, setValues] = useState({
    ...initial,
    overtime_hourly_fixed_rate: initial.overtime_hourly_fixed_rate ?? "",
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    update.mutate(
      {
        ...values,
        overtime_hourly_fixed_rate: values.overtime_hourly_fixed_rate || null,
      },
      { onSuccess: () => toast.success("Overtime settings saved") },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ToggleRow
        id="overtime_enabled"
        label="Overtime enabled"
        checked={values.overtime_enabled}
        onChange={(v) => setValues((cur) => ({ ...cur, overtime_enabled: v }))}
      />
      <ToggleRow
        id="weekend_overtime_enabled"
        label="Weekend overtime enabled"
        checked={values.weekend_overtime_enabled}
        onChange={(v) => setValues((cur) => ({ ...cur, weekend_overtime_enabled: v }))}
      />
      <ToggleRow
        id="holiday_overtime_enabled"
        label="Holiday overtime enabled"
        checked={values.holiday_overtime_enabled}
        onChange={(v) => setValues((cur) => ({ ...cur, holiday_overtime_enabled: v }))}
      />
      <ToggleRow
        id="hourly_overtime_enabled"
        label="Hourly overtime enabled"
        description="off by default — a full extra day is the default unit"
        checked={values.hourly_overtime_enabled}
        onChange={(v) => setValues((cur) => ({ ...cur, hourly_overtime_enabled: v }))}
      />
      <FormField label="Minutes considered a full overtime day" htmlFor="overtime_full_day_minutes">
        <Input
          id="overtime_full_day_minutes"
          type="number"
          min={1}
          value={values.overtime_full_day_minutes}
          onChange={(e) => setValues((v) => ({ ...v, overtime_full_day_minutes: Number(e.target.value) }))}
        />
      </FormField>
      <FormField label="Daily salary basis">
        <Select
          value={values.overtime_daily_salary_basis}
          onValueChange={(v) => setValues((cur) => ({ ...cur, overtime_daily_salary_basis: v as OvertimeDailySalaryBasis }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SALARY_BASIS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Hourly rate mode">
        <Select
          value={values.overtime_hourly_rate_mode}
          onValueChange={(v) => setValues((cur) => ({ ...cur, overtime_hourly_rate_mode: v as OvertimeHourlyRateMode }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RATE_MODES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Fixed hourly rate" htmlFor="overtime_hourly_fixed_rate">
          <Input
            id="overtime_hourly_fixed_rate"
            type="number"
            step="0.0001"
            disabled={values.overtime_hourly_rate_mode !== "FIXED"}
            value={values.overtime_hourly_fixed_rate}
            onChange={(e) => setValues((v) => ({ ...v, overtime_hourly_fixed_rate: e.target.value }))}
          />
        </FormField>
        <FormField label="Hourly multiplier" htmlFor="overtime_hourly_multiplier">
          <Input
            id="overtime_hourly_multiplier"
            type="number"
            step="0.01"
            min={0}
            value={values.overtime_hourly_multiplier}
            onChange={(e) => setValues((v) => ({ ...v, overtime_hourly_multiplier: e.target.value }))}
          />
        </FormField>
      </div>
      <Button type="submit" disabled={update.isPending}>
        Save overtime settings
      </Button>
    </form>
  );
}

export function OvertimeSettingsTab() {
  const { data, isLoading } = useOvertimeSettings();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form initial={data} />;
}
