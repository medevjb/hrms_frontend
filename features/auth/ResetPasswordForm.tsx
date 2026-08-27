"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { z } from "zod";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

export function ResetPasswordForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: { password: "", password_confirmation: "" },
    validate: schemaResolver(schema, { sync: true }),
  });

  async function handleSubmit(values: typeof form.values) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, ...values }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.message ?? "That reset link is invalid or has expired.");
        return;
      }

      router.push("/login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack gap="md">
      <Title order={2}>Choose a new password</Title>
      <Text c="dimmed" size="sm">
        {email}
      </Text>
      {error && (
        <Alert color="red" icon={<IconAlertCircle size={18} />}>
          {error}
        </Alert>
      )}
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            autoFocus
            {...form.getInputProps("password")}
          />
          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            {...form.getInputProps("password_confirmation")}
          />
          <Button type="submit" loading={submitting} fullWidth>
            Reset password
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
