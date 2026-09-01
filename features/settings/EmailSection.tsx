"use client";

import { useState } from "react";
import { SendIcon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormStatus } from "@/components/ui/FormStatus";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-error";
import { useMailSettings, useSendTestEmail, useUpdateMailSettings } from "@/services/settings";
import type { MailSettings } from "@/types/settings";

const NONE = "none";

function Form({ initial }: { initial: MailSettings }) {
  const update = useUpdateMailSettings();
  const sendTest = useSendTestEmail();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [testTo, setTestTo] = useState("");

  const [values, setValues] = useState({
    mail_from_name: initial.mail_from_name ?? "",
    mail_from_address: initial.mail_from_address ?? "",
    mail_host: initial.mail_host ?? "",
    mail_port: initial.mail_port?.toString() ?? "587",
    mail_username: initial.mail_username ?? "",
    mail_encryption: initial.mail_encryption ?? NONE,
  });
  const [newPassword, setNewPassword] = useState("");

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaved(false);

    try {
      await update.mutateAsync({
        mail_from_name: values.mail_from_name.trim() || null,
        mail_from_address: values.mail_from_address.trim() || null,
        mail_host: values.mail_host.trim() || null,
        mail_port: values.mail_port ? Number(values.mail_port) : null,
        mail_username: values.mail_username.trim() || null,
        mail_encryption: values.mail_encryption === NONE ? null : (values.mail_encryption as "tls" | "ssl"),
        ...(newPassword ? { mail_password: newPassword } : {}),
      });
      setNewPassword("");
      setSaved(true);
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

  async function handleTest() {
    if (!testTo.trim()) return;
    try {
      await sendTest.mutateAsync(testTo.trim());
      toast.success(`Test email sent to ${testTo.trim()}.`);
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Couldn't send the test email.");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormStatus error={error} saved={saved} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="From name" htmlFor="mail_from_name" error={fieldErrors.mail_from_name}>
            <Input
              id="mail_from_name"
              placeholder="Acme HR"
              value={values.mail_from_name}
              onChange={(e) => set("mail_from_name", e.target.value)}
            />
          </FormField>
          <FormField
            label="From address"
            htmlFor="mail_from_address"
            error={fieldErrors.mail_from_address}
          >
            <Input
              id="mail_from_address"
              type="email"
              placeholder="hr@acme.com"
              value={values.mail_from_address}
              onChange={(e) => set("mail_from_address", e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
          <FormField label="SMTP host" htmlFor="mail_host" error={fieldErrors.mail_host}>
            <Input
              id="mail_host"
              placeholder="smtp.acme.com"
              value={values.mail_host}
              onChange={(e) => set("mail_host", e.target.value)}
            />
          </FormField>
          <FormField label="Port" htmlFor="mail_port" error={fieldErrors.mail_port}>
            <Input
              id="mail_port"
              type="number"
              value={values.mail_port}
              onChange={(e) => set("mail_port", e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Username" htmlFor="mail_username" error={fieldErrors.mail_username}>
            <Input
              id="mail_username"
              value={values.mail_username}
              onChange={(e) => set("mail_username", e.target.value)}
            />
          </FormField>
          <FormField
            label="Password"
            htmlFor="mail_password"
            description={initial.mail_password_set ? "Leave blank to keep the stored password" : undefined}
            error={fieldErrors.mail_password}
          >
            <PasswordInput
              id="mail_password"
              autoComplete="new-password"
              placeholder={initial.mail_password_set ? "••••••••" : ""}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Encryption" htmlFor="mail_encryption">
          <Select
            value={values.mail_encryption}
            onValueChange={(value) => set("mail_encryption", value)}
          >
            <SelectTrigger id="mail_encryption" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tls">TLS</SelectItem>
              <SelectItem value="ssl">SSL</SelectItem>
              <SelectItem value={NONE}>None</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save email settings"}
        </Button>
      </form>

      <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">Send a test email</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Confirms the settings above actually deliver. Save first.
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            type="email"
            placeholder="you@acme.com"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            className="max-w-xs"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={sendTest.isPending || !testTo.trim()}
          >
            <SendIcon className="size-3.5" />
            {sendTest.isPending ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EmailSection() {
  const { data, isLoading } = useMailSettings();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form initial={data} />;
}
