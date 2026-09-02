"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheckIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/components/ui/toast";

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
  const [submitting, setSubmitting] = useState(false);

  async function handleCredentialsSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""]),
        ),
      );
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
        toast.error(data.message ?? "Login failed. Please try again.");
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

    try {
      const { response, data } = await postJson("/api/auth/two-factor-challenge", {
        challenge_id: stage.challengeId,
        ...(useRecoveryCode ? { recovery_code: recoveryCode } : { code }),
      });

      if (!response.ok) {
        toast.error(data.message ?? "That code didn't work. Please try again.");
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
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheckIcon className="size-5.5" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Two-factor verification
            </h1>
            <p className="text-sm text-muted-foreground">
              {useRecoveryCode
                ? "Enter one of your saved recovery codes."
                : "Enter the 6-digit code from your authenticator app."}
            </p>
          </div>
        </div>

        <form onSubmit={handleCodeSubmit} className="space-y-4">
          {useRecoveryCode ? (
            <FormField label="Recovery code" htmlFor="recoveryCode">
              <Input
                id="recoveryCode"
                autoFocus
                autoComplete="one-time-code"
                value={recoveryCode}
                onChange={(event) => setRecoveryCode(event.target.value)}
                className="h-11 font-mono"
              />
            </FormField>
          ) : (
            <FormField label="Authentication code" htmlFor="code">
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                className="h-12 text-center font-mono text-lg tracking-[0.4em]"
              />
            </FormField>
          )}
          <Button type="submit" disabled={submitting} className="h-11 w-full text-sm font-semibold">
            {submitting ? "Verifying…" : "Verify"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setUseRecoveryCode((current) => !current)}
          >
            {useRecoveryCode ? "Use an authentication code instead" : "Use a recovery code instead"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back — enter your details to continue.</p>
      </div>

      <form onSubmit={handleCredentialsSubmit} className="space-y-4">
        <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            autoFocus
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11"
          />
        </FormField>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11"
          />
          {fieldErrors.password && (
            <p className="text-xs font-medium text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        <Button type="submit" disabled={submitting} className="h-11 w-full text-sm font-semibold">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Access is provisioned by your HR team. Contact them if you can&apos;t sign in.
      </p>
    </div>
  );
}
