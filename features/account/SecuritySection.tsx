"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, ShieldCheckIcon, ShieldIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError } from "@/lib/api-error";
import { useChangePassword, useProfile } from "@/services/profile";

const schema = z
  .object({
    current_password: z.string().min(1, "Enter your current password"),
    password: z.string().min(8, "Use at least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

function TwoFactorRow({ enabled }: { enabled: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-muted/30 p-4">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">Two-factor authentication</p>
        <p className="text-xs text-muted-foreground">
          {enabled
            ? "You're asked for a code from your authenticator app when you sign in. Contact HR to reset it."
            : "Sign-in only asks for your password. Enrolment is handled during sign-in."}
        </p>
      </div>
      <span
        className={
          enabled
            ? "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
        }
      >
        {enabled ? <ShieldCheckIcon className="size-3.5" /> : <ShieldIcon className="size-3.5" />}
        {enabled ? "On" : "Off"}
      </span>
    </div>
  );
}

function PasswordForm() {
  const router = useRouter();
  const change = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = schema.safeParse({
      current_password: currentPassword,
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

    try {
      await change.mutateAsync(parsed.data);
      toast.success("Password changed. Please sign in again.");
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
      router.push("/login");
      router.refresh();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(
          Object.fromEntries(Object.entries(caught.errors ?? {}).map(([f, m]) => [f, m[0]])),
        );
        setError(caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="space-y-3 border-t border-border pt-6">
      <div className="space-y-0.5">
        <h3 className="font-heading text-sm font-bold text-foreground">Password</h3>
        <p className="text-xs text-muted-foreground">
          Changing it signs you out on every device — you&apos;ll sign in again with the new one.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 pt-1">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          label="Current password"
          htmlFor="current_password"
          error={fieldErrors.current_password}
        >
          <PasswordInput
            id="current_password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </FormField>
        <FormField label="New password" htmlFor="new_password" error={fieldErrors.password}>
          <PasswordInput
            id="new_password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        <FormField
          label="Confirm new password"
          htmlFor="new_password_confirmation"
          error={fieldErrors.password_confirmation}
        >
          <PasswordInput
            id="new_password_confirmation"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
        </FormField>

        <Button type="submit" disabled={change.isPending}>
          {change.isPending ? "Updating…" : "Change password"}
        </Button>
      </form>
    </div>
  );
}

export function SecuritySection() {
  const { data, isLoading } = useProfile();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return (
    <div className="space-y-6">
      <TwoFactorRow enabled={data.two_factor_enabled} />
      <PasswordForm />
    </div>
  );
}
