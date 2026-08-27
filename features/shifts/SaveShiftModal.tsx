"use client";

import { useState } from "react";
import { Alert, Button, Group, Modal, NumberInput, Stack, Switch, TextInput } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import { useCreateShift, useUpdateShift } from "@/services/shifts";
import type { Shift } from "@/types/shifts";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  expected_work_minutes: z.number().min(1, "Must be at least 1 minute"),
});

export function SaveShiftModal({
  opened,
  onClose,
  shift,
}: {
  opened: boolean;
  onClose: () => void;
  shift?: Shift;
}) {
  const isEdit = Boolean(shift);
  const createShift = useCreateShift();
  const updateShift = useUpdateShift(shift?.id ?? 0);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: shift?.name ?? "",
      start_time: shift?.start_time ?? "",
      end_time: shift?.end_time ?? "",
      expected_work_minutes: shift?.expected_work_minutes ?? 480,
      break_minutes: shift?.break_minutes ?? 60,
      late_grace_minutes: shift?.late_grace_minutes ?? null,
      active: shift?.active ?? true,
    },
    validate: schemaResolver(schema, { sync: true }),
  });

  async function handleSubmit(values: typeof form.values) {
    setError(null);

    const input = {
      name: values.name,
      start_time: values.start_time,
      end_time: values.end_time,
      expected_work_minutes: values.expected_work_minutes,
      break_minutes: values.break_minutes,
      late_grace_minutes: values.late_grace_minutes,
      active: values.active,
    };

    try {
      if (isEdit) {
        await updateShift.mutateAsync(input);
      } else {
        await createShift.mutateAsync(input);
      }
      form.reset();
      onClose();
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

  const pending = createShift.isPending || updateShift.isPending;

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? "Edit shift" : "New shift"}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={18} />}>
              {error}
            </Alert>
          )}
          <TextInput label="Name" {...form.getInputProps("name")} />
          <Group grow>
            <TextInput type="time" label="Start time" {...form.getInputProps("start_time")} />
            <TextInput type="time" label="End time" {...form.getInputProps("end_time")} />
          </Group>
          <Group grow>
            <NumberInput
              label="Expected work minutes"
              min={1}
              {...form.getInputProps("expected_work_minutes")}
            />
            <NumberInput label="Break minutes" min={0} {...form.getInputProps("break_minutes")} />
          </Group>
          <NumberInput
            label="Late grace minutes (shift-specific override)"
            description="Leave blank to use the organization default"
            min={0}
            {...form.getInputProps("late_grace_minutes")}
          />
          <Switch label="Active" {...form.getInputProps("active", { type: "checkbox" })} />
          <Button type="submit" loading={pending}>
            {isEdit ? "Save changes" : "Create shift"}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
