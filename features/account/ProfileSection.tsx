"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { FormStatus } from "@/components/ui/FormStatus";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { ApiError } from "@/lib/api-error";
import { proxyMedia } from "@/lib/media";
import {
  useDeleteProfilePhoto,
  useProfile,
  useUpdateProfile,
  useUpdateProfilePhoto,
} from "@/services/profile";
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
        {children || "—"}
      </dd>
    </div>
  );
}

function PhotoField({ profile }: { profile: Profile }) {
  const upload = useUpdateProfilePhoto();
  const remove = useDeleteProfilePhoto();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const photoUrl = proxyMedia(profile.photo_url);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("That image is over 4 MB. Choose a smaller one.");
      return;
    }

    try {
      await upload.mutateAsync(file);
      toast.success("Photo updated.");
      router.refresh();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Couldn't upload that photo.");
    }
  }

  async function onRemove() {
    try {
      await remove.mutateAsync();
      toast.success("Photo removed.");
      router.refresh();
    } catch {
      toast.error("Couldn't remove the photo.");
    }
  }

  const busy = upload.isPending || remove.isPending;

  return (
    <div className="flex items-center gap-5">
      <Avatar className="size-16 border border-border">
        {photoUrl && <AvatarImage src={photoUrl} alt="" />}
        <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
          {profile.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || !profile.employee}
            onClick={() => inputRef.current?.click()}
          >
            <UploadIcon className="size-3.5" />
            {profile.photo_url ? "Replace photo" : "Upload photo"}
          </Button>
          {profile.photo_url && (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onRemove}>
              <Trash2Icon className="size-3.5" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {profile.employee
            ? "JPG, PNG or WebP, up to 4 MB."
            : "A photo needs an employee record — ask your HR team."}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onFile}
        />
      </div>
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

  const emp = profile.employee;

  return (
    <div className="space-y-6">
      <PhotoField profile={profile} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormStatus error={error} saved={saved} savedText="Profile saved." />

        <FormField label="Full name" htmlFor="profile_name" error={fieldErrors.name}>
          <Input id="profile_name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <FormField
          label="Email"
          htmlFor="profile_email"
          description="Contact your HR team to change this"
        >
          <Input id="profile_email" value={profile.email} disabled />
        </FormField>

        {emp && (
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
              <Input id="profile_address" value={address} onChange={(e) => setAddress(e.target.value)} />
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

      {emp && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Employment</CardTitle>
            <CardDescription>Managed by your HR team.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border/60">
              <Fact label="Employee code">{emp.employee_code}</Fact>
              <Fact label="Designation">{emp.designation}</Fact>
              <Fact label="Employment type">{humanize(emp.employment_type)}</Fact>
              <Fact label="Status">{humanize(emp.status)}</Fact>
              <Fact label="Department">{emp.department?.name}</Fact>
              <Fact label="Team">{emp.team?.name}</Fact>
              <Fact label="Reporting to">{emp.team_leader?.full_name}</Fact>
              <Fact label="Shift">{emp.current_shift?.name}</Fact>
              <Fact label="Weekly off">{emp.weekend_day ? humanize(emp.weekend_day) : "Organization default"}</Fact>
              <Fact label="Joining date">{emp.joining_date}</Fact>
              {emp.confirmation_date && (
                <Fact label="Confirmation date">{emp.confirmation_date}</Fact>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ProfileSection() {
  const { data, isLoading } = useProfile();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form key={data.email} profile={data} />;
}
