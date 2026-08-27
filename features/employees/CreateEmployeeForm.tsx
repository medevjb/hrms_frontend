"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Group,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { schemaResolver, useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import { useCreateEmployee } from "@/services/employees";
import type { EmploymentType } from "@/types/organization";

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
];

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  designation: z.string().min(1, "Designation is required"),
  employment_type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
  // Mantine's DateInput reports value as a "YYYY-MM-DD" string
  // (DateStringValue), not a Date object — see @mantine/dates' types.
  joining_date: z.string().min(1, "Joining date is required"),
});

export function CreateEmployeeForm() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      email: "",
      first_name: "",
      last_name: "",
      designation: "",
      employment_type: "FULL_TIME" as EmploymentType,
      joining_date: "" as string | null,
    },
    validate: schemaResolver(schema, { sync: true }),
  });

  async function handleSubmit(values: typeof form.values) {
    if (!values.joining_date) return;

    setError(null);

    try {
      const employee = await createEmployee.mutateAsync({
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        designation: values.designation,
        employment_type: values.employment_type,
        joining_date: values.joining_date,
      });

      router.push(`/employees/${employee.id}`);
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
        <Group grow>
          <TextInput label="First name" {...form.getInputProps("first_name")} />
          <TextInput label="Last name" {...form.getInputProps("last_name")} />
        </Group>
        <TextInput label="Email" {...form.getInputProps("email")} />
        <TextInput label="Designation" {...form.getInputProps("designation")} />
        <Select
          label="Employment type"
          data={EMPLOYMENT_TYPES}
          {...form.getInputProps("employment_type")}
        />
        <DateInput label="Joining date" {...form.getInputProps("joining_date")} />
        <Button type="submit" loading={createEmployee.isPending}>
          Send invitation
        </Button>
      </Stack>
    </form>
  );
}
