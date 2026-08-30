"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, CircleCheckIcon } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { ApiError } from "@/lib/api-error";
import { useProfile, useUpdateProfile } from "@/services/profile";
import type { Profile } from "@/types/profile";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

function humanize(value: string): string {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium break-words text-foreground">
        {children ?? "—"}
      </dd>
    </div>
  );
}

function Form({ profile }: { profile: Profile }) {
  const router = useRouter();
  const update = useUpdateProfile();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.employee?.phone ?? "");
  const [address, setAddress] = useState(profile.employee?.address ?? "");
  const [emergencyName, setEmergencyName] = useState(profile.employee?.emergency_contact_name ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(
    profile.employee?.emergency_contact_phone ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaved(false);

    const parsed = schema.safeParse({ name });
    if (!parsed.success) {
      setFieldErrors({ name: parsed.error.flatten().fieldErrors.name?.[0] ?? "" });
      return;
    }

    try {
      await update.mutateAsync({
        name,
        ...(profile.employee
          ? {
              phone: phone.trim() || null,
              address: address.trim() || null,
              emergency_contact_name: emergencyName.trim() || null,
              emergency_contact_phone: emergencyPhone.trim() || null,
            }
          : {}),
      });
      setSaved(true);
      // The app shell renders the name/initials from the server session.
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
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-14 border border-border">
          <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
            {profile.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-heading text-lg font-bold tracking-tight text-foreground">
            {profile.name}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {profile.employee?.designation ?? profile.email}
          </p>
        </div>
      </div>

      {profile.employee && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Employment</CardTitle>
            <CardDescription>Managed by your HR team.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border/60">
              <Fact label="Employee code">{profile.employee.employee_code}</Fact>
              <Fact label="Employment type">{humanize(profile.employee.employment_type)}</Fact>
              <Fact label="Department">{profile.employee.department?.name ?? "—"}</Fact>
              <Fact label="Team">{profile.employee.team?.name ?? "—"}</Fact>
              <Fact label="Joining date">{profile.employee.joining_date}</Fact>
            </dl>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {saved && (
          <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/10">
            <CircleCheckIcon className="text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="text-emerald-800 dark:text-emerald-300">
              Profile saved.
            </AlertDescription>
          </Alert>
        )}

        <FormField label="Full name" htmlFor="profile_name" error={fieldErrors.name}>
          <Input id="profile_name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <FormField label="Email" htmlFor="profile_email" description="Contact your HR team to change this">
          <Input id="profile_email" value={profile.email} disabled />
        </FormField>

        {profile.employee && (
          <>
            <FormField label="Phone" htmlFor="profile_phone" error={fieldErrors.phone}>
              <Input
                id="profile_phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
            <FormField label="Home address" htmlFor="profile_address" error={fieldErrors.address}>
              <Input
                id="profile_address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Emergency contact"
                htmlFor="profile_emergency_name"
                error={fieldErrors.emergency_contact_name}
              >
                <Input
                  id="profile_emergency_name"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
              </FormField>
              <FormField
                label="Emergency phone"
                htmlFor="profile_emergency_phone"
                error={fieldErrors.emergency_contact_phone}
              >
                <Input
                  id="profile_emergency_phone"
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
              </FormField>
            </div>
          </>
        )}

        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}

export function ProfileTab() {
  const { data, isLoading } = useProfile();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form key={data.email} profile={data} />;
}
