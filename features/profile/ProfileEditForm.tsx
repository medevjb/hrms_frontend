"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { ApiError } from "@/lib/api-error";
import { useProfile, useUpdateProfile } from "@/services/profile";
import type { Profile } from "@/types/profile";
import { AvatarUpload } from "./AvatarUpload";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

function humanize(value: string): string {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function LockedFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm text-muted-foreground">{value}</dd>
    </div>
  );
}

function Form({ profile }: { profile: Profile }) {
  const router = useRouter();
  const update = useUpdateProfile();
  const employee = profile.employee;

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [address, setAddress] = useState(employee?.address ?? "");
  const [emergencyName, setEmergencyName] = useState(employee?.emergency_contact_name ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(employee?.emergency_contact_phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = schema.safeParse({ name });
    if (!parsed.success) {
      setFieldErrors({ name: parsed.error.flatten().fieldErrors.name?.[0] ?? "" });
      return;
    }

    try {
      await update.mutateAsync({
        name,
        ...(employee
          ? {
              phone: phone.trim() || null,
              address: address.trim() || null,
              emergency_contact_name: emergencyName.trim() || null,
              emergency_contact_phone: emergencyPhone.trim() || null,
            }
          : {}),
      });
      toast.success("Profile updated");
      router.push("/profile");
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
    <div className="mx-auto max-w-xl space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 gap-2 text-muted-foreground" asChild>
        <Link href="/profile">
          <ArrowLeftIcon className="size-4" />
          Back to profile
        </Link>
      </Button>

      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Edit profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your photo and contact details. Your HR team manages everything else.
        </p>
      </div>

      <AvatarUpload name={profile.name} photoUrl={profile.photo_url} />

      <form onSubmit={handleSubmit} className="space-y-4 border-t border-border/60 pt-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField label="Full name" htmlFor="edit_name" error={fieldErrors.name}>
          <Input id="edit_name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <FormField
          label="Email"
          htmlFor="edit_email"
          description="Contact your HR team to change this"
        >
          <Input id="edit_email" value={profile.email} disabled />
        </FormField>

        {employee && (
          <>
            <FormField label="Phone" htmlFor="edit_phone" error={fieldErrors.phone}>
              <Input
                id="edit_phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
            <FormField label="Home address" htmlFor="edit_address" error={fieldErrors.address}>
              <Input
                id="edit_address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Emergency contact"
                htmlFor="edit_emergency_name"
                error={fieldErrors.emergency_contact_name}
              >
                <Input
                  id="edit_emergency_name"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
              </FormField>
              <FormField
                label="Emergency phone"
                htmlFor="edit_emergency_phone"
                error={fieldErrors.emergency_contact_phone}
              >
                <Input
                  id="edit_emergency_phone"
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
              </FormField>
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/profile">Cancel</Link>
          </Button>
        </div>
      </form>

      {employee && (
        <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Set by your HR team
          </p>
          <dl className="mt-1 divide-y divide-border/50">
            <LockedFact label="Designation" value={employee.designation} />
            <LockedFact label="Employment type" value={humanize(employee.employment_type)} />
            <LockedFact label="Department" value={employee.department?.name ?? "—"} />
            <LockedFact label="Team" value={employee.team?.name ?? "—"} />
            <LockedFact label="Shift" value={employee.current_shift?.name ?? "Unassigned"} />
            <LockedFact label="Joining date" value={employee.joining_date} />
          </dl>
        </div>
      )}
    </div>
  );
}

export function ProfileEditForm() {
  const { data, isLoading } = useProfile();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form key={data.email} profile={data} />;
}
