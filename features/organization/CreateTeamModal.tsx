"use client";

import { useState } from "react";
import { Alert, Button, Modal, Stack, TextInput } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import { useCreateTeam } from "@/services/teams";
import { EmployeeSelect } from "./EmployeeSelect";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

export function CreateTeamModal({
  departmentId,
  opened,
  onClose,
}: {
  departmentId: number;
  opened: boolean;
  onClose: () => void;
}) {
  const createTeam = useCreateTeam();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { name: "", teamLeaderId: null as string | null },
    validate: schemaResolver(schema, { sync: true }),
  });

  async function handleSubmit(values: typeof form.values) {
    setError(null);

    try {
      await createTeam.mutateAsync({
        department_id: departmentId,
        name: values.name,
        team_leader_id: values.teamLeaderId ? Number(values.teamLeaderId) : null,
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
    <Modal opened={opened} onClose={onClose} title="New team">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={18} />}>
              {error}
            </Alert>
          )}
          <TextInput label="Name" {...form.getInputProps("name")} />
          <EmployeeSelect
            label="Team Leader"
            value={form.values.teamLeaderId}
            onChange={(value) => form.setFieldValue("teamLeaderId", value)}
          />
          <Button type="submit" loading={createTeam.isPending}>
            Create team
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
