"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { ApiError } from "@/lib/api-error";
import { useOrganizationSettings, useUpdateOrganizationSettings } from "@/services/settings";
import type { OrganizationSettingsData } from "@/types/settings";
import { WEEKDAYS } from "@/types/settings";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";

function Form({ initial }: { initial: OrganizationSettingsData }) {
  const update = useUpdateOrganizationSettings();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm({
    initialValues: {
      company_name: initial.company_name,
      timezone: initial.timezone,
      currency: initial.currency,
      currency_decimal_places: initial.currency_decimal_places,
      weekend_days: initial.weekend_days,
    },
  });

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
        <TextInput label="Company name" {...form.getInputProps("company_name")} />
        <TextInput
          label="Timezone"
          description="IANA timezone, e.g. Asia/Dhaka — authoritative for attendance"
          {...form.getInputProps("timezone")}
        />
        <Group grow>
          <TextInput label="Currency" description="3-letter ISO code" {...form.getInputProps("currency")} />
          <NumberInput
            label="Currency decimal places"
            min={0}
            max={4}
            {...form.getInputProps("currency_decimal_places")}
          />
        </Group>
        <Checkbox.Group
          label="Weekend days"
          value={form.values.weekend_days}
          onChange={(value) => form.setFieldValue("weekend_days", value)}
        >
          <Group mt="xs">
            {WEEKDAYS.map((day) => (
              <Checkbox key={day} value={day} label={day[0].toUpperCase() + day.slice(1)} />
            ))}
          </Group>
        </Checkbox.Group>
        <Button type="submit" loading={update.isPending}>
          Save organization settings
        </Button>
      </Stack>
    </form>
  );
}

export function OrganizationSettingsTab() {
  const { data, isLoading } = useOrganizationSettings();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form initial={data} />;
}
