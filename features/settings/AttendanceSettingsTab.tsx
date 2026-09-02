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
import { useAttendanceSettings, useUpdateAttendanceSettings } from "@/services/settings";
import type { AttendanceSettings, MissingCheckoutPolicy } from "@/types/settings";

const MISSING_CHECKOUT_POLICIES: { value: MissingCheckoutPolicy; label: string }[] = [
  { value: "LEAVE_OPEN", label: "Leave the check-in open" },
  { value: "AUTO_CLOSE_AT_SHIFT_END", label: "Auto-close at shift end" },
];

function Form({ initial }: { initial: AttendanceSettings }) {
  const update = useUpdateAttendanceSettings();
  const [values, setValues] = useState(initial);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    update.mutate(values, {
      onSuccess: () => toast.success("Attendance settings saved"),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Late grace period (minutes)"
        htmlFor="late_grace_minutes"
        description="How late an employee can check in before it counts as late"
      >
        <Input
          id="late_grace_minutes"
          type="number"
          min={0}
          max={120}
          value={values.late_grace_minutes}
          onChange={(e) => setValues((v) => ({ ...v, late_grace_minutes: Number(e.target.value) }))}
        />
      </FormField>
      <div className="flex items-center gap-2">
        <Switch
          id="auto_absent_enabled"
          checked={values.auto_absent_enabled}
          onCheckedChange={(checked) => setValues((v) => ({ ...v, auto_absent_enabled: checked }))}
        />
        <label htmlFor="auto_absent_enabled" className="text-sm font-medium">
          Auto-mark absent when there&apos;s no check-in
        </label>
      </div>
      <FormField label="Missing checkout policy">
        <Select
          value={values.missing_checkout_policy}
          onValueChange={(v) => setValues((cur) => ({ ...cur, missing_checkout_policy: v as MissingCheckoutPolicy }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MISSING_CHECKOUT_POLICIES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField
        label="Minimum minutes for a half day"
        htmlFor="attendance_min_minutes_half_day"
        description="Leave blank if half-day attendance isn't used"
      >
        <Input
          id="attendance_min_minutes_half_day"
          type="number"
          min={0}
          value={values.attendance_min_minutes_half_day ?? ""}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              attendance_min_minutes_half_day: e.target.value === "" ? null : Number(e.target.value),
            }))
          }
        />
      </FormField>
      <Button type="submit" disabled={update.isPending}>
        Save attendance settings
      </Button>
    </form>
  );
}

export function AttendanceSettingsTab() {
  const { data, isLoading } = useAttendanceSettings();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form initial={data} />;
}
