"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircleIcon } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

const credentialsSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type Stage = { kind: "credentials" } | { kind: "two-factor"; challengeId: string };

type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as ApiErrorBody & Record<string, unknown>;

  return { response, data };
}

export function LoginForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "credentials" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCredentialsSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setError(null);

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""]),
      ));
      return;
    }

    setSubmitting(true);
    try {
      const { response, data } = await postJson("/api/auth/login", {
        email,
        password,
        device_name: "web",
      });

      if (response.status === 202) {
        setStage({ kind: "two-factor", challengeId: data.challenge_id as string });
        return;
      }

      if (!response.ok) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(data.errors ?? {}).map(([field, messages]) => [field, messages[0]]),
          ),
        );
        setError(data.message ?? "Login failed. Please try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCodeSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (stage.kind !== "two-factor") return;

    setSubmitting(true);
    setError(null);

    try {
      const { response, data } = await postJson("/api/auth/two-factor-challenge", {
        challenge_id: stage.challengeId,
        ...(useRecoveryCode ? { recovery_code: recoveryCode } : { code }),
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
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Two-factor verification
          </h1>
          <p className="text-sm text-muted-foreground">
            {useRecoveryCode
              ? "Enter one of your recovery codes."
              : "Enter the code from your authenticator app."}
          </p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          {useRecoveryCode ? (
            <FormField label="Recovery code" htmlFor="recoveryCode">
              <Input
                id="recoveryCode"
                autoFocus
                value={recoveryCode}
                onChange={(event) => setRecoveryCode(event.target.value)}
              />
            </FormField>
          ) : (
            <FormField label="Authentication code" htmlFor="code">
              <Input
                id="code"
                inputMode="numeric"
                autoFocus
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </FormField>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            Verify
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              setUseRecoveryCode((current) => !current);
              setError(null);
            }}
          >
            {useRecoveryCode ? "Use an authentication code instead" : "Use a recovery code instead"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Sign in</h1>
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleCredentialsSubmit} className="space-y-4">
        <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
          <Input
            id="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        <FormField label="Password" htmlFor="password" error={fieldErrors.password}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <Button type="submit" disabled={submitting} className="w-full">
          Sign in
        </Button>
        <div className="text-center">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot your password?
          </Link>
        </div>
      </form>
    </div>
  );
}
