"use client";

import { useState } from "react";
import { Alert, Button, NumberInput, Select, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { ApiError } from "@/lib/api-error";
import { usePayrollSettings, useUpdatePayrollSettings } from "@/services/settings";
import type { PayrollSettings } from "@/types/settings";

const CALCULATION_METHODS = [
  { value: "FIXED_30_DAYS", label: "Fixed 30 days" },
  { value: "CALENDAR_DAYS", label: "Calendar days in the month" },
  { value: "WORKING_DAYS", label: "Working days in the month" },
];

function Form({ initial }: { initial: PayrollSettings }) {
  const update = useUpdatePayrollSettings();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm({ initialValues: initial });

  async function handleSubmit(values: typeof form.values) {
    setError(null);
    setSaved(false);

    try {
      await update.mutateAsync(values);
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
        <NumberInput
          label="Payroll cutoff day"
          description="Leave blank for a standard 1st-to-month-end period"
          min={1}
          max={28}
          {...form.getInputProps("payroll_cutoff_day")}
        />
        <Select
          label="Salary day calculation method"
          data={CALCULATION_METHODS}
          {...form.getInputProps("salary_day_calculation_method")}
        />
        <Button type="submit" loading={update.isPending}>
          Save payroll settings
        </Button>
      </Stack>
    </form>
  );
}

export function PayrollSettingsTab() {
  const { data, isLoading } = usePayrollSettings();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form initial={data} />;
}
