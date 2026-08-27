"use client";

import { useState } from "react";
import { Alert, Button, Stack, Text, TextInput, Title } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { IconCheck } from "@tabler/icons-react";
import { z } from "zod";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: { email: "" },
    validate: schemaResolver(schema, { sync: true }),
  });

  async function handleSubmit(values: typeof form.values) {
    setSubmitting(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      // The backend always returns a generic success, whether or not the
      // email is registered — don't reveal that distinction here either.
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Stack gap="md">
        <Title order={2}>Check your email</Title>
        <Alert color="green" icon={<IconCheck size={18} />}>
          If that email address is registered, a password reset link has been sent.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Title order={2}>Reset your password</Title>
      <Text c="dimmed" size="sm">
        Enter your email and we&apos;ll send you a link to reset your password.
      </Text>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Email"
            autoComplete="username"
            autoFocus
            {...form.getInputProps("email")}
          />
          <Button type="submit" loading={submitting} fullWidth>
            Send reset link
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
