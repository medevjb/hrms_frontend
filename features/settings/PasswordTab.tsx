"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError } from "@/lib/api-error";
import { useChangePassword } from "@/services/profile";

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

export function PasswordTab() {
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
      // §92.2 — the change revoked every token, this session included.
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
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <Alert>
        <ShieldCheckIcon />
        <AlertDescription>
          Changing your password signs you out on every device. You&apos;ll sign in again with the
          new one.
        </AlertDescription>
      </Alert>

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
  );
}
