"use client";

import { useState } from "react";
import Link from "next/link";
import { differenceInCalendarMonths, format, isValid, parseISO } from "date-fns";
import { CheckIcon, CopyIcon, MailIcon, PencilIcon, PhoneIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { photoSrc } from "@/lib/photo";
import { useProfile } from "@/services/profile";
import type { EmployeeStatus } from "@/types/organization";
import type { Profile } from "@/types/profile";

const STATUS_TONE: Record<EmployeeStatus, StatusTone> = {
  INVITED: "neutral",
  ACTIVE: "success",
  PROBATION: "warning",
  NOTICE_PERIOD: "warning",
  SUSPENDED: "danger",
  RESIGNED: "warning",
  TERMINATED: "danger",
  ARCHIVED: "neutral",
};

function humanize(value: string): string {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function fmtDate(value: string | null, pattern = "d MMM yyyy"): string {
  if (!value) return "—";
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, pattern) : value;
}

function tenure(joiningDate: string): string {
  const start = parseISO(joiningDate);
  if (!isValid(start)) return "—";
  const months = Math.max(0, differenceInCalendarMonths(new Date(), start));
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (months < 1) return "New this month";
  if (years === 0) return `${rest} mo`;
  if (rest === 0) return `${years} yr`;
  return `${years} yr ${rest} mo`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium text-foreground">
        {children ?? "—"}
      </dd>
    </div>
  );
}

function CopyRow({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success("Copied");
        setTimeout(() => setCopied(false), 1500);
      }}
      className="group -mx-2 flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{value}</span>
      {copied ? (
        <CheckIcon className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <CopyIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}

function View({ profile }: { profile: Profile }) {
  const employee = profile.employee;
  const src = photoSrc(profile.photo_url);
  const orgPath =
    [employee?.department?.name, employee?.team?.name].filter(Boolean).join("  ›  ") || "Unassigned";
  const manager = employee?.team_leader
    ? { name: employee.team_leader.full_name, role: "team lead" }
    : employee?.operation_manager
      ? { name: employee.operation_manager.full_name, role: "ops manager" }
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted ring-1 ring-border/60">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={profile.name} className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
                  {initials(profile.name)}
                </span>
              )}
            </div>
            <div className="min-w-0 space-y-1.5">
              <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {profile.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {employee?.designation ?? "No employee record"}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                {employee && (
                  <StatusChip tone={STATUS_TONE[employee.status]}>
                    {humanize(employee.status)}
                  </StatusChip>
                )}
                {employee && (
                  <>
                    <span className="font-mono font-semibold">{employee.employee_code}</span>
                    <span aria-hidden>·</span>
                    <span>{humanize(employee.employment_type)}</span>
                    <span aria-hidden>·</span>
                    <span>{tenure(employee.joining_date)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button asChild variant="outline" className="shrink-0 gap-2">
            <Link href="/profile/edit">
              <PencilIcon className="size-4" />
              Edit profile
            </Link>
          </Button>
        </div>

        {employee && (
          <div className="mt-6 border-t border-border/60 pt-5">
            <SectionLabel>Position</SectionLabel>
            <p className="mt-1.5 text-sm font-medium text-foreground">{orgPath}</p>
            {manager && (
              <p className="mt-1 text-xs text-muted-foreground">
                Reports to {manager.name} · {manager.role}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 grid gap-x-10 gap-y-6 border-t border-border/60 pt-4 sm:grid-cols-2">
          {employee && (
            <div>
              <SectionLabel>Employment</SectionLabel>
              <dl className="mt-1 divide-y divide-border/60">
                <Fact label="Type">{humanize(employee.employment_type)}</Fact>
                <Fact label="Joined">{fmtDate(employee.joining_date)}</Fact>
                <Fact label="Confirmation">{fmtDate(employee.confirmation_date)}</Fact>
                <Fact label="Shift">{employee.current_shift?.name ?? "Unassigned"}</Fact>
                <Fact label="Overtime">
                  {employee.overtime_eligible ? "Eligible" : "Not eligible"}
                </Fact>
              </dl>
            </div>
          )}

          <div className={employee ? undefined : "sm:col-span-2"}>
            <SectionLabel>Contact</SectionLabel>
            <div className="mt-1.5">
              <CopyRow icon={MailIcon} value={profile.email} />
              {employee?.phone && <CopyRow icon={PhoneIcon} value={employee.phone} />}
            </div>
            {employee && (
              <dl className="mt-1 divide-y divide-border/60">
                <Fact label="Address">{employee.address ?? "—"}</Fact>
                <Fact label="Office">{employee.office_location ?? "—"}</Fact>
                <Fact label="Timezone">{employee.timezone ?? "—"}</Fact>
              </dl>
            )}
          </div>
        </div>

        {employee && (
          <div className="mt-6 border-t border-border/60 pt-4">
            <SectionLabel>Emergency contact</SectionLabel>
            {employee.emergency_contact_name || employee.emergency_contact_phone ? (
              <dl className="mt-1 divide-y divide-border/60 sm:max-w-sm">
                <Fact label="Name">{employee.emergency_contact_name ?? "—"}</Fact>
                <Fact label="Phone">{employee.emergency_contact_phone ?? "—"}</Fact>
              </dl>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                None on file.{" "}
                <Link href="/profile/edit" className="text-primary hover:underline">
                  Add one
                </Link>
                .
              </p>
            )}
          </div>
        )}
      </div>

      <p className="px-2 text-xs text-muted-foreground">
        Your HR team keeps this record. Contact them to change your role, team, shift, dates, or
        anything that isn&apos;t editable on the edit screen.
      </p>
    </div>
  );
}

export function ProfileView() {
  const { data, isLoading } = useProfile();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <View profile={data} />;
}
