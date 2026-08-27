"use client";

import { useState } from "react";
import { Alert, Button, Modal, Select, Stack, Switch, Textarea, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { schemaResolver, useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import { useCreateHoliday, useUpdateHoliday } from "@/services/holidays";
import type { Holiday, HolidayType } from "@/types/holidays";

const HOLIDAY_TYPES: { value: HolidayType; label: string }[] = [
  { value: "NATIONAL", label: "National" },
  { value: "RELIGIOUS", label: "Religious" },
  { value: "COMPANY", label: "Company" },
  { value: "OTHER", label: "Other" },
];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  // DateInput reports value as a "YYYY-MM-DD" string, not a Date object.
  date: z.string().min(1, "Date is required"),
  type: z.enum(["NATIONAL", "RELIGIOUS", "COMPANY", "OTHER"]),
});

export function SaveHolidayModal({
  opened,
  onClose,
  holiday,
}: {
  opened: boolean;
  onClose: () => void;
  holiday?: Holiday;
}) {
  const isEdit = Boolean(holiday);
  const createHoliday = useCreateHoliday();
  const updateHoliday = useUpdateHoliday(holiday?.id ?? 0);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      title: holiday?.title ?? "",
      date: holiday?.date ?? ("" as string | null),
      type: (holiday?.type ?? "COMPANY") as HolidayType,
      description: holiday?.description ?? "",
      office_location: holiday?.office_location ?? "",
      active: holiday?.active ?? true,
    },
    validate: schemaResolver(schema, { sync: true }),
  });

  async function handleSubmit(values: typeof form.values) {
    if (!values.date) return;

    setError(null);

    const input = {
      title: values.title,
      date: values.date,
      type: values.type,
      description: values.description || null,
      office_location: values.office_location || null,
      active: values.active,
    };

    try {
      if (isEdit) {
        await updateHoliday.mutateAsync(input);
      } else {
        await createHoliday.mutateAsync(input);
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

  const pending = createHoliday.isPending || updateHoliday.isPending;

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? "Edit holiday" : "New holiday"}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={18} />}>
              {error}
            </Alert>
          )}
          <TextInput label="Title" {...form.getInputProps("title")} />
          <DateInput label="Date" {...form.getInputProps("date")} />
          <Select label="Type" data={HOLIDAY_TYPES} {...form.getInputProps("type")} />
          <Textarea label="Description" {...form.getInputProps("description")} />
          <TextInput label="Office location" {...form.getInputProps("office_location")} />
          <Switch label="Active" {...form.getInputProps("active", { type: "checkbox" })} />
          <Button type="submit" loading={pending}>
            {isEdit ? "Save changes" : "Create holiday"}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
