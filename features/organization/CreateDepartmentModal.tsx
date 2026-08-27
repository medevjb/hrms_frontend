"use client";

import { useState } from "react";
import { Alert, Button, Modal, Stack, TextInput } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import { useCreateDepartment } from "@/services/departments";
import { EmployeeSelect } from "./EmployeeSelect";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

export function CreateDepartmentModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const createDepartment = useCreateDepartment();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { name: "", description: "", operationManagerId: null as string | null },
    validate: schemaResolver(schema, { sync: true }),
  });

  async function handleSubmit(values: typeof form.values) {
    setError(null);

    try {
      await createDepartment.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        operation_manager_id: values.operationManagerId ? Number(values.operationManagerId) : null,
      });
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

  return (
    <Modal opened={opened} onClose={onClose} title="New department">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={18} />}>
              {error}
            </Alert>
          )}
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Description" {...form.getInputProps("description")} />
          <EmployeeSelect
            label="Operation Manager"
            value={form.values.operationManagerId}
            onChange={(value) => form.setFieldValue("operationManagerId", value)}
          />
          <Button type="submit" loading={createDepartment.isPending}>
            Create department
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
