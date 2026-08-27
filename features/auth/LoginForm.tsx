"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type Stage =
  | { kind: "credentials" }
  | { kind: "two-factor"; challengeId: string };

type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

function firstFieldErrors(errors?: Record<string, string[]>) {
  if (!errors) return {};

  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, messages[0]]),
  );
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as ApiErrorBody &
    Record<string, unknown>;

  return { response, data };
}

export function LoginForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "credentials" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const credentialsForm = useForm({
    initialValues: { email: "", password: "" },
    validate: schemaResolver(credentialsSchema, { sync: true }),
  });

  const codeForm = useForm({ initialValues: { code: "", recoveryCode: "" } });

  async function handleCredentialsSubmit(values: typeof credentialsForm.values) {
    setSubmitting(true);
    setError(null);

    try {
      const { response, data } = await postJson("/api/auth/login", {
        ...values,
        device_name: "web",
      });

      if (response.status === 202) {
        setStage({ kind: "two-factor", challengeId: data.challenge_id as string });
        return;
      }

      if (!response.ok) {
        credentialsForm.setErrors(firstFieldErrors(data.errors));
        setError(data.message ?? "Login failed. Please try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCodeSubmit(values: typeof codeForm.values) {
    if (stage.kind !== "two-factor") return;

    setSubmitting(true);
    setError(null);

    try {
      const { response, data } = await postJson("/api/auth/two-factor-challenge", {
        challenge_id: stage.challengeId,
        ...(useRecoveryCode
          ? { recovery_code: values.recoveryCode }
          : { code: values.code }),
      });

      if (!response.ok) {
        setError(data.message ?? "That code didn't work. Please try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (stage.kind === "two-factor") {
    return (
      <Stack gap="md">
        <Title order={2}>Two-factor verification</Title>
        <Text c="dimmed" size="sm">
          {useRecoveryCode
            ? "Enter one of your recovery codes."
            : "Enter the code from your authenticator app."}
        </Text>
        {error && (
          <Alert color="red" icon={<IconAlertCircle size={18} />}>
            {error}
          </Alert>
        )}
        <form onSubmit={codeForm.onSubmit(handleCodeSubmit)}>
          <Stack gap="md">
            {useRecoveryCode ? (
              <TextInput
                label="Recovery code"
                autoFocus
                {...codeForm.getInputProps("recoveryCode")}
              />
            ) : (
              <TextInput
                label="Authentication code"
                inputMode="numeric"
                autoFocus
                {...codeForm.getInputProps("code")}
              />
            )}
            <Button type="submit" loading={submitting} fullWidth>
              Verify
            </Button>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => {
                setUseRecoveryCode((current) => !current);
                setError(null);
              }}
            >
              {useRecoveryCode ? "Use an authentication code instead" : "Use a recovery code instead"}
            </Button>
          </Stack>
        </form>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Title order={2}>Sign in</Title>
      {error && (
        <Alert color="red" icon={<IconAlertCircle size={18} />}>
          {error}
        </Alert>
      )}
      <form onSubmit={credentialsForm.onSubmit(handleCredentialsSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Email"
            autoComplete="username"
            autoFocus
            {...credentialsForm.getInputProps("email")}
          />
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            {...credentialsForm.getInputProps("password")}
          />
          <Group justify="flex-end">
            <Button type="submit" loading={submitting} fullWidth>
              Sign in
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
