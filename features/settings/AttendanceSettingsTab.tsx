"use client";

import { useState } from "react";
import { Alert, Button, NumberInput, Select, Stack, Switch } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { ApiError } from "@/lib/api-error";
import { useAttendanceSettings, useUpdateAttendanceSettings } from "@/services/settings";
import type { AttendanceSettings } from "@/types/settings";

const MISSING_CHECKOUT_POLICIES = [
  { value: "LEAVE_OPEN", label: "Leave the check-in open" },
  { value: "AUTO_CLOSE_AT_SHIFT_END", label: "Auto-close at shift end" },
];

function Form({ initial }: { initial: AttendanceSettings }) {
  const update = useUpdateAttendanceSettings();
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
          label="Late grace period (minutes)"
          description="How late an employee can check in before it counts as late"
          min={0}
          max={120}
          {...form.getInputProps("late_grace_minutes")}
        />
        <Switch
          label="Auto-mark absent when there's no check-in"
          {...form.getInputProps("auto_absent_enabled", { type: "checkbox" })}
        />
        <Select
          label="Missing checkout policy"
          data={MISSING_CHECKOUT_POLICIES}
          {...form.getInputProps("missing_checkout_policy")}
        />
        <NumberInput
          label="Minimum minutes for a half day"
          description="Leave blank if half-day attendance isn't used"
          min={0}
          {...form.getInputProps("attendance_min_minutes_half_day")}
        />
        <Button type="submit" loading={update.isPending}>
          Save attendance settings
        </Button>
      </Stack>
    </form>
  );
}

export function AttendanceSettingsTab() {
  const { data, isLoading } = useAttendanceSettings();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form initial={data} />;
}
