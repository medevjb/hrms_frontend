"use client";

import { useRef, useState } from "react";
import { CameraIcon, MailIcon, PhoneIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyRow, Fact, RailLabel } from "@/components/ui/DetailRail";
import { FormField } from "@/components/ui/form-field";
import { FormStatus } from "@/components/ui/FormStatus";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeStatusBadge } from "@/features/employees/EmployeeStatusBadge";
import { ApiError } from "@/lib/api-error";
import { fmtDate, getInitials, humanize, tenureDetail } from "@/lib/people";
import { proxyMedia } from "@/lib/media";
import {
  useDeleteProfilePhoto,
  useProfile,
  useUpdateProfile,
  useUpdateProfilePhoto,
} from "@/services/profile";
import type { Profile } from "@/types/profile";
import { MyDocumentsTab } from "./MyDocumentsTab";
import { SecuritySection } from "./SecuritySection";

function RailAvatar({ profile }: { profile: Profile }) {
  const upload = useUpdateProfilePhoto();
  const remove = useDeleteProfilePhoto();
  const inputRef = useRef<HTMLInputElement>(null);
  const photoUrl = proxyMedia(profile.photo_url);
  const canHavePhoto = Boolean(profile.employee);
  const busy = upload.isPending || remove.isPending;

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("That image is over 3 MB. Choose a smaller one.");
      return;
    }
    try {
      await upload.mutateAsync(file);
      toast.success("Photo updated.");
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Couldn't upload that photo.");
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="group relative shrink-0">
        <Avatar className="size-16 border border-border">
          {photoUrl && <AvatarImage src={photoUrl} alt="" />}
          <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
            {getInitials(profile.employee?.full_name ?? profile.name)}
          </AvatarFallback>
        </Avatar>
        {canHavePhoto && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              aria-label={profile.photo_url ? "Change photo" : "Upload photo"}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-40"
            >
              <CameraIcon className="size-5" />
            </button>
            <span
              aria-hidden
              className="pointer-events-none absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm"
            >
              <CameraIcon className="size-3" />
            </span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onFile}
        />
      </div>
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-bold leading-tight tracking-tight text-foreground">
          {profile.employee?.full_name ?? profile.name}
        </h1>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {profile.employee?.designation ?? profile.email}
        </p>
        {canHavePhoto && (
          <div className="mt-1.5 flex items-center gap-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1 text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
            >
              <CameraIcon className="size-3" />
              {busy ? "Uploading…" : profile.photo_url ? "Change photo" : "Upload photo"}
            </button>
            {profile.photo_url && (
              <button
                type="button"
                onClick={() =>
                  remove
                    .mutateAsync()
                    .then(() => toast.success("Photo removed."))
                    .catch(() => toast.error("Couldn't remove the photo."))
                }
                disabled={busy}
                className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <Trash2Icon className="size-3" />
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TenureStat({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-1 py-2 text-center">
      <p className="font-mono text-xl font-bold leading-none tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {unit}
      </p>
    </div>
  );
}

function IdentityRail({ profile }: { profile: Profile }) {
  const [copied, setCopied] = useState<string | null>(null);
  const emp = profile.employee;

  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`Copied ${field}`);
    setTimeout(() => setCopied(null), 2000);
  }

  const orgPath =
    [emp?.department?.name, emp?.team?.name].filter(Boolean).join("  ›  ") || "Unassigned";
  const service = emp ? tenureDetail(emp.joining_date) : null;

  return (
    <aside className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 lg:sticky lg:top-24">
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs sm:p-6">
        <RailAvatar profile={profile} />

        {emp && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <EmployeeStatusBadge status={emp.status} />
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {humanize(emp.employment_type)}
            </span>
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
              {emp.employee_code}
            </span>
          </div>
        )}

        {service && (
          <div className="mt-6 border-t border-border/60 pt-5">
            <RailLabel>Time with the company</RailLabel>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <TenureStat value={service.years} unit={service.years === 1 ? "year" : "years"} />
              <TenureStat value={service.months} unit={service.months === 1 ? "month" : "months"} />
              <TenureStat value={service.days} unit={service.days === 1 ? "day" : "days"} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {service.totalDays.toLocaleString()} days total · since {service.since}
            </p>
          </div>
        )}

        {emp && (
          <div className="mt-5 border-t border-border/60 pt-5">
            <RailLabel>Position</RailLabel>
            <p className="mt-1.5 text-sm font-medium text-foreground">{orgPath}</p>
            {emp.team_leader && (
              <p className="mt-1 text-xs text-muted-foreground">
                Reports to {emp.team_leader.full_name} · team lead
              </p>
            )}
          </div>
        )}

        {emp && (
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border/60 pt-4">
            <div>
              <RailLabel>Shift</RailLabel>
              <p className="mt-1 text-sm font-medium text-foreground">
                {emp.current_shift?.name ?? "Unassigned"}
              </p>
            </div>
            <div>
              <RailLabel>Weekly off</RailLabel>
              <p className="mt-1 text-sm font-medium text-foreground">
                {emp.weekend_day ? humanize(emp.weekend_day) : "Org default"}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-border/60 pt-4">
          <RailLabel>Contact</RailLabel>
          <div className="mt-1.5">
            <CopyRow
              icon={MailIcon}
              value={profile.email}
              copied={copied === "email"}
              onCopy={() => copy(profile.email, "email")}
            />
            {emp?.phone && (
              <CopyRow
                icon={PhoneIcon}
                value={emp.phone}
                copied={copied === "phone"}
                onCopy={() => copy(emp.phone!, "phone")}
              />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

const nameSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
});
const displayNameSchema = z.object({ name: z.string().trim().min(1, "Name is required").max(255) });

function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile();
  const emp = profile.employee;
  const [firstName, setFirstName] = useState(emp?.first_name ?? "");
  const [lastName, setLastName] = useState(emp?.last_name ?? "");
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(emp?.phone ?? "");
  const [address, setAddress] = useState(emp?.address ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaved(false);

    const parsed = emp
      ? nameSchema.safeParse({ first_name: firstName, last_name: lastName })
      : displayNameSchema.safeParse({ name });
    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""]),
        ),
      );
      return;
    }

    try {
      await update.mutateAsync(
        emp
          ? {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              phone: phone.trim() || null,
              address: address.trim() || null,
            }
          : { name: name.trim() },
      );
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormStatus error={error} saved={saved} savedText="Profile saved." />

      {emp ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name" htmlFor="first_name" error={fieldErrors.first_name}>
            <Input id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </FormField>
          <FormField label="Last name" htmlFor="last_name" error={fieldErrors.last_name}>
            <Input id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </FormField>
        </div>
      ) : (
        <FormField label="Display name" htmlFor="display_name" error={fieldErrors.name}>
          <Input id="display_name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
      )}

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
            <Input
              id="profile_address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </FormField>
        </>
      )}

      <Button type="submit" disabled={update.isPending}>
        {update.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function EmergencyForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile();
  const [contactName, setContactName] = useState(profile.employee?.emergency_contact_name ?? "");
  const [contactPhone, setContactPhone] = useState(profile.employee?.emergency_contact_phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await update.mutateAsync({
        emergency_contact_name: contactName.trim() || null,
        emergency_contact_phone: contactPhone.trim() || null,
      });
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormStatus error={error} saved={saved} savedText="Emergency contact saved." />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Contact name" htmlFor="ec_name">
          <Input id="ec_name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </FormField>
        <FormField label="Contact phone" htmlFor="ec_phone">
          <Input
            id="ec_phone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </FormField>
      </div>
      <Button type="submit" disabled={update.isPending}>
        {update.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function EmploymentFacts({ profile }: { profile: Profile }) {
  const emp = profile.employee!;
  return (
    <dl className="divide-y divide-border/60">
      <Fact label="Employee code">{emp.employee_code}</Fact>
      <Fact label="Designation">{emp.designation}</Fact>
      <Fact label="Employment type">{humanize(emp.employment_type)}</Fact>
      <Fact label="Status">{humanize(emp.status)}</Fact>
      <Fact label="Department">{emp.department?.name}</Fact>
      <Fact label="Team">{emp.team?.name}</Fact>
      <Fact label="Reporting to">{emp.team_leader?.full_name}</Fact>
      <Fact label="Operations manager">{emp.operation_manager?.full_name}</Fact>
      <Fact label="Shift">{emp.current_shift?.name}</Fact>
      <Fact label="Weekly off">
        {emp.weekend_day ? humanize(emp.weekend_day) : "Organization default"}
      </Fact>
      <Fact label="Overtime">{emp.overtime_eligible ? "Eligible" : "Not eligible"}</Fact>
      <Fact label="Office location">{emp.office_location}</Fact>
      <Fact label="Timezone">{emp.timezone}</Fact>
      <Fact label="Joining date">{fmtDate(emp.joining_date)}</Fact>
      <Fact label="Confirmation date">{fmtDate(emp.confirmation_date)}</Fact>
    </dl>
  );
}

function Content({ profile }: { profile: Profile }) {
  const emp = profile.employee;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
      <IdentityRail profile={profile} />

      <div className="min-w-0">
        <Tabs defaultValue="profile" className="gap-0">
          <TabsList className="max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {emp && <TabsTrigger value="emergency">Emergency contact</TabsTrigger>}
            {emp && <TabsTrigger value="employment">Employment</TabsTrigger>}
            {emp && <TabsTrigger value="documents">Documents</TabsTrigger>}
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="pt-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Your details</CardTitle>
                <CardDescription>The name and contact details other people see.</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm profile={profile} />
              </CardContent>
            </Card>
          </TabsContent>

          {emp && (
            <TabsContent value="emergency" className="pt-6">
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Emergency contact</CardTitle>
                  <CardDescription>Who your HR team reaches if something happens at work.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmergencyForm profile={profile} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {emp && (
            <TabsContent value="employment" className="pt-6">
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Employment</CardTitle>
                  <CardDescription>
                    Your team, shift, salary, and status are managed by your HR team.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmploymentFacts profile={profile} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {emp && (
            <TabsContent value="documents" className="pt-6">
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Documents</CardTitle>
                  <CardDescription>
                    Files your HR team has filed for you. Open one to read it, or download a copy.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MyDocumentsTab employeeId={emp.id} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="security" className="pt-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Security</CardTitle>
                <CardDescription>Your password and two-factor status.</CardDescription>
              </CardHeader>
              <CardContent>
                <SecuritySection />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function AccountPage() {
  const { data, isLoading } = useProfile();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Content key={data.email} profile={data} />;
}
