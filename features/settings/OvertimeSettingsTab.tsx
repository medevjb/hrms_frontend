"use client";

import { useState } from "react";
import { Alert, Button, Group, NumberInput, Select, Stack, Switch } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { ApiError } from "@/lib/api-error";
import { useOvertimeSettings, useUpdateOvertimeSettings } from "@/services/settings";
import type { OvertimeSettings } from "@/types/settings";

const SALARY_BASIS = [
  { value: "BASIC", label: "Basic salary" },
  { value: "GROSS", label: "Gross salary" },
];

const RATE_MODES = [
  { value: "FIXED", label: "Fixed hourly rate" },
  { value: "SALARY_DERIVED", label: "Derived from salary" },
];

function Form({ initial }: { initial: OvertimeSettings }) {
  const update = useUpdateOvertimeSettings();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm({
    initialValues: {
      ...initial,
      overtime_hourly_fixed_rate: initial.overtime_hourly_fixed_rate ?? "",
    },
  });

  async function handleSubmit(values: typeof form.values) {
    setError(null);
    setSaved(false);

    try {
      await update.mutateAsync({
        ...values,
        overtime_hourly_fixed_rate: values.overtime_hourly_fixed_rate || null,
      });
      setSaved(true);
    } catch (caught) {
      if (caught instanceof ApiError) {
        form.setErrors(
          Object.fromEntries(
            Object.entries(caught.errors ?? {}).map(([field, messages]) => [field, messages[0]]),
          ),
        );
        setError(caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md" maw={480}>
        {error && (
          <Alert color="red" icon={<IconAlertCircle size={18} />}>
            {error}
          </Alert>
        )}
        {saved && (
          <Alert color="green" icon={<IconAlertCircle size={18} />}>
            Saved.
          </Alert>
        )}
        <Switch label="Overtime enabled" {...form.getInputProps("overtime_enabled", { type: "checkbox" })} />
        <Switch
          label="Weekend overtime enabled"
          {...form.getInputProps("weekend_overtime_enabled", { type: "checkbox" })}
        />
        <Switch
          label="Holiday overtime enabled"
          {...form.getInputProps("holiday_overtime_enabled", { type: "checkbox" })}
        />
        <Switch
          label="Hourly overtime enabled"
          description="Off by default — a full extra day is the default unit"
          {...form.getInputProps("hourly_overtime_enabled", { type: "checkbox" })}
        />
        <NumberInput
          label="Minutes considered a full overtime day"
          min={1}
          {...form.getInputProps("overtime_full_day_minutes")}
        />
        <Select label="Daily salary basis" data={SALARY_BASIS} {...form.getInputProps("overtime_daily_salary_basis")} />
        <Select label="Hourly rate mode" data={RATE_MODES} {...form.getInputProps("overtime_hourly_rate_mode")} />
        <Group grow>
          <NumberInput
            label="Fixed hourly rate"
            disabled={form.values.overtime_hourly_rate_mode !== "FIXED"}
            decimalScale={4}
            {...form.getInputProps("overtime_hourly_fixed_rate")}
          />
          <NumberInput
            label="Hourly multiplier"
            decimalScale={2}
            min={0}
            {...form.getInputProps("overtime_hourly_multiplier")}
          />
        </Group>
        <Button type="submit" loading={update.isPending}>
          Save overtime settings
        </Button>
      </Stack>
    </form>
  );
}

export function OvertimeSettingsTab() {
  const { data, isLoading } = useOvertimeSettings();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form initial={data} />;
}
