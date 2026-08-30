"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  CheckIcon,
  KeyRoundIcon,
  LockIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

function calculateStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "bg-border" };
  let score = 0;
  if (pwd.length >= 8) score += 25;
  if (pwd.length >= 12) score += 25;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
  if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 25;

  if (score <= 25) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 50) return { score, label: "Fair", color: "bg-amber-500" };
  if (score <= 75) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong & Secure", color: "bg-emerald-500" };
}

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => calculateStrength(password), [password]);
  const isMatch = password.length > 0 && password === passwordConfirmation;
  const isMismatch = passwordConfirmation.length > 0 && password !== passwordConfirmation;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setError(null);

    const parsed = schema.safeParse({
      password,
      password_confirmation: passwordConfirmation,
    });
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.message ?? "That reset link is invalid or has expired.");
        return;
      }

      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2Icon className="size-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Password Reset Complete!
          </h2>
          <p className="text-sm text-muted-foreground">
            Your password has been updated successfully. You can now sign in with your new credentials.
          </p>
        </div>

        <Button asChild className="w-full h-11 text-sm font-semibold rounded-xl gap-2 mt-2">
          <Link href="/login">
            <span>Sign In Now</span>
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <KeyRoundIcon className="size-6" />
          </div>
          <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs font-medium">
            <LockIcon className="size-3 text-primary" />
            <span>Secure Reset</span>
          </Badge>
        </div>

        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Set New Password
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            Resetting password for <strong className="text-foreground">{email}</strong>
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="New Password" htmlFor="password" error={fieldErrors.password}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            autoFocus
            placeholder="Enter at least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10 rounded-xl bg-background/50"
          />
        </FormField>

        {/* Real-time Strength Bar */}
        {password.length > 0 && (
          <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-muted-foreground">Password strength:</span>
              <span className="font-semibold text-foreground">{strength.label}</span>
            </div>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
          </div>
        )}

        <FormField
          label="Confirm New Password"
          htmlFor="password_confirmation"
          error={fieldErrors.password_confirmation}
        >
          <PasswordInput
            id="password_confirmation"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            className="h-10 rounded-xl bg-background/50"
          />
        </FormField>

        {/* Live Match Indicator */}
        {passwordConfirmation.length > 0 && (
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              isMatch ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
            }`}
          >
            {isMatch ? (
              <>
                <CheckIcon className="size-3.5" />
                <span>Passwords match</span>
              </>
            ) : (
              <>
                <XIcon className="size-3.5" />
                <span>Passwords do not match</span>
              </>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting || isMismatch}
          className="w-full h-11 text-sm font-semibold rounded-xl gap-2 mt-2"
        >
          <span>{submitting ? "Resetting Password..." : "Update Password"}</span>
          <ShieldCheckIcon className="size-4" />
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-border/50">
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

