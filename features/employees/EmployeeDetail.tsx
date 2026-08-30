"use client";

import { useState } from "react";
import Link from "next/link";
import { differenceInCalendarMonths, format, isValid, parseISO } from "date-fns";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  MailIcon,
  PhoneIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ShiftSelect } from "@/features/shifts/ShiftSelect";
import {
  useAssignShift,
  useEmployee,
  useTransferEmployee,
  useUpdateEmployeeStatus,
} from "@/services/employees";
import { useCreateShiftOverride, useShifts } from "@/services/shifts";
import { useTeams } from "@/services/teams";
import type { EmployeeStatus } from "@/types/organization";
import { EmployeeDocumentsSection } from "./EmployeeDocumentsSection";
import { EmployeeSalarySection } from "./EmployeeSalarySection";
import { EmployeeStatusBadge } from "./EmployeeStatusBadge";

const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "PROBATION", label: "Probation" },
  { value: "NOTICE_PERIOD", label: "Notice period" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "ARCHIVED", label: "Archived" },
];

function getInitials(name: string): string {
  if (!name) return "EM";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function humanize(value: string): string {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function fmtDate(value: string | null, pattern = "d MMM yyyy"): string {
  if (!value) return "—";
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, pattern) : value;
}

/** Length of service, phrased the way HR references it — the one fact about a
 *  person that isn't already on the employee list. */
function tenure(joiningDate: string): { headline: string; caption: string } {
  const start = parseISO(joiningDate);
  if (!isValid(start)) return { headline: "—", caption: "" };
  const months = Math.max(0, differenceInCalendarMonths(new Date(), start));
  const years = Math.floor(months / 12);
  const rest = months % 12;

  let headline = "New this month";
  if (months >= 1 && years === 0) headline = `${rest} mo`;
  else if (years >= 1 && rest === 0) headline = `${years} yr`;
  else if (years >= 1) headline = `${years} yr ${rest} mo`;

  return { headline, caption: `Joined ${format(start, "MMM yyyy")}` };
}

function RailLabel({ children }: { children: React.ReactNode }) {
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
      <dd className="min-w-0 text-right text-sm font-medium break-words text-foreground">
        {children ?? "—"}
      </dd>
    </div>
  );
}

function CopyRow({
  icon: Icon,
  value,
  copied,
  onCopy,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="group -mx-2 flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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

export function EmployeeDetail({ employeeId }: { employeeId: number }) {
  const { data: employee, isLoading, error } = useEmployee(employeeId);
  const { data: teams } = useTeams();
  const { data: shifts } = useShifts();
  const transferEmployee = useTransferEmployee(employeeId);
  const updateStatus = useUpdateEmployeeStatus(employeeId);
  const assignShift = useAssignShift(employeeId);
  const createShiftOverride = useCreateShiftOverride();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [pendingStatus, setPendingStatus] = useState<EmployeeStatus | null>(null);

  const [overrideShiftId, setOverrideShiftId] = useState<string | null>(null);
  const [overrideDate, setOverrideDate] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  // The dropdown selection and the "confirm this" state are separate — picking
  // a value shouldn't fire the confirmation dialog on its own.
  const [teamChoice, setTeamChoice] = useState<string | null>(null);
  const [shiftChoice, setShiftChoice] = useState<string | null>(null);
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const [pendingShiftId, setPendingShiftId] = useState<string | null>(null);

  if (isLoading) return <PageLoadingSkeleton />;

  if (error || !employee) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link href="/employees">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to employees
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>
            We couldn&apos;t find this employee, or you don&apos;t have access to their record.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function confirmTransfer() {
    if (!pendingTeamId) return;
    transferEmployee.mutate(
      { team_id: Number(pendingTeamId) },
      {
        onSuccess: () => {
          toast.success("Employee transferred");
          setTeamChoice(null);
        },
        onError: () => toast.error("Transfer failed. Try again."),
        onSettled: () => setPendingTeamId(null),
      },
    );
  }

  function confirmAssignShift() {
    if (!pendingShiftId) return;
    assignShift.mutate(
      { shift_id: Number(pendingShiftId) },
      {
        onSuccess: () => {
          toast.success("Regular shift updated");
          setShiftChoice(null);
        },
        onError: () => toast.error("Couldn't assign that shift. Try again."),
        onSettled: () => setPendingShiftId(null),
      },
    );
  }

  function submitStatusChange() {
    if (!pendingStatus || !reason.trim()) return;
    updateStatus.mutate(
      { status: pendingStatus, reason },
      {
        onSuccess: () => {
          toast.success("Status updated");
          setReason("");
          setPendingStatus(null);
        },
        onError: () => toast.error("Status update failed. Try again."),
      },
    );
  }

  function submitShiftOverride() {
    if (!overrideShiftId || !overrideDate || !overrideReason.trim()) return;
    createShiftOverride.mutate(
      {
        employee_id: employeeId,
        shift_id: Number(overrideShiftId),
        work_date: overrideDate,
        reason: overrideReason,
      },
      {
        onSuccess: () => {
          toast.success("One-day shift change set");
          setOverrideShiftId(null);
          setOverrideDate(null);
          setOverrideReason("");
        },
        onError: () => toast.error("Couldn't set the shift change. Try again."),
      },
    );
  }

  const { headline: tenureHeadline, caption: tenureCaption } = tenure(employee.joining_date);
  const orgPath =
    [employee.department?.name, employee.team?.name].filter(Boolean).join("  ›  ") || "Unassigned";
  const manager = employee.team_leader
    ? { name: employee.team_leader.full_name, role: "team lead" }
    : employee.operation_manager
      ? { name: employee.operation_manager.full_name, role: "ops manager" }
      : null;
  const currentShiftId = employee.current_shift ? String(employee.current_shift.id) : null;
  const currentTeamId = employee.team ? String(employee.team.id) : null;
  const pendingTeamName = teams?.find((team) => String(team.id) === pendingTeamId)?.name;
  const pendingShiftName = shifts?.find((shift) => String(shift.id) === pendingShiftId)?.name;
  const hasEmergencyContact =
    Boolean(employee.emergency_contact_name) || Boolean(employee.emergency_contact_phone);

  return (
    <div className="space-y-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-2 text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href="/employees">
          <ArrowLeftIcon className="size-4" />
          Back to employees
        </Link>
      </Button>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
        {/* Identity rail — who this person is and where they sit, kept in view
            while you work in any tab. */}
        <aside className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs sm:p-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border border-border">
                <AvatarImage src={employee.profile_image_path ?? undefined} alt={employee.full_name} />
                <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                  {getInitials(employee.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="font-heading text-xl font-bold leading-tight tracking-tight text-foreground">
                  {employee.full_name}
                </h1>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{employee.designation}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <EmployeeStatusBadge status={employee.status} />
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {humanize(employee.employment_type)}
              </span>
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
                {employee.employee_code}
              </span>
            </div>

            <div className="mt-6 border-t border-border/60 pt-5">
              <RailLabel>Tenure</RailLabel>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground">
                {tenureHeadline}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tenureCaption}
                {employee.status === "PROBATION" ? " · on probation" : ""}
              </p>
            </div>

            <div className="mt-5 border-t border-border/60 pt-5">
              <RailLabel>Position</RailLabel>
              <p className="mt-1.5 text-sm font-medium text-foreground">{orgPath}</p>
              {manager && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Reports to {manager.name} · {manager.role}
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border/60 pt-4">
              <div>
                <RailLabel>Shift</RailLabel>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {employee.current_shift?.name ?? "Unassigned"}
                </p>
              </div>
              <div>
                <RailLabel>Overtime</RailLabel>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {employee.overtime_eligible ? "Eligible" : "Not eligible"}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-border/60 pt-4">
              <RailLabel>Contact</RailLabel>
              <div className="mt-1.5">
                <CopyRow
                  icon={MailIcon}
                  value={employee.email}
                  copied={copiedField === "email"}
                  onCopy={() => handleCopy(employee.email, "email")}
                />
                {employee.phone && (
                  <CopyRow
                    icon={PhoneIcon}
                    value={employee.phone}
                    copied={copiedField === "phone"}
                    onCopy={() => handleCopy(employee.phone!, "phone")}
                  />
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Working area */}
        <div className="min-w-0">
          <Tabs defaultValue="profile" className="gap-0">
            <TabsList className="max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="shift">Shift &amp; team</TabsTrigger>
              <TabsTrigger value="salary">Salary</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>

            {/* Profile — personal detail that doesn't live in the rail */}
            <TabsContent value="profile" className="space-y-5 pt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Personal &amp; location</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="divide-y divide-border/60">
                    <Fact label="Home address">{employee.address ?? "—"}</Fact>
                    <Fact label="Office location">{employee.office_location ?? "—"}</Fact>
                    <Fact label="Timezone">{employee.timezone ?? "—"}</Fact>
                    <Fact label="Joining date">{fmtDate(employee.joining_date)}</Fact>
                    <Fact label="Confirmation date">{fmtDate(employee.confirmation_date)}</Fact>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Emergency contact</CardTitle>
                </CardHeader>
                <CardContent>
                  {hasEmergencyContact ? (
                    <dl className="divide-y divide-border/60">
                      <Fact label="Name">{employee.emergency_contact_name ?? "—"}</Fact>
                      <Fact label="Phone">
                        {employee.emergency_contact_phone ? (
                          <a
                            href={`tel:${employee.emergency_contact_phone}`}
                            className="text-primary hover:underline"
                          >
                            {employee.emergency_contact_phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </Fact>
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No emergency contact on file. Add one from the edit screen.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shift & team */}
            <TabsContent value="shift" className="space-y-5 pt-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Regular shift</CardTitle>
                    <CardDescription>The recurring shift this person is scheduled on.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                      <RailLabel>Current</RailLabel>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {employee.current_shift?.name ?? "No shift assigned"}
                      </p>
                    </div>
                    <ShiftSelect label="Change to" value={shiftChoice} onChange={setShiftChoice} />
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={!shiftChoice || shiftChoice === currentShiftId}
                      onClick={() => setPendingShiftId(shiftChoice)}
                    >
                      Assign shift
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Move to another team</CardTitle>
                    <CardDescription>
                      Ends the current team assignment today and starts the new one.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                      <RailLabel>Current</RailLabel>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {employee.team?.name ?? "No team"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employee.department?.name ?? "No department"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="block text-sm font-medium text-foreground">Move to</label>
                      <Select value={teamChoice ?? undefined} onValueChange={setTeamChoice}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                          {(teams ?? []).map((team) => (
                            <SelectItem key={team.id} value={String(team.id)}>
                              {team.name} · {team.department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={!teamChoice || teamChoice === currentTeamId}
                      onClick={() => setPendingTeamId(teamChoice)}
                    >
                      Transfer employee
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">One-day shift change</CardTitle>
                  <CardDescription>
                    Overrides the schedule for a single date. The regular shift stays as it is.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
                    <ShiftSelect
                      label="Shift for that day"
                      value={overrideShiftId}
                      onChange={setOverrideShiftId}
                    />
                    <div className="flex flex-col gap-2">
                      <label htmlFor="override_date" className="block text-sm font-medium text-foreground">
                        Date
                      </label>
                      <DatePicker id="override_date" value={overrideDate} onChange={setOverrideDate} />
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <label htmlFor="override_reason" className="block text-sm font-medium text-foreground">
                        Reason
                      </label>
                      <Textarea
                        id="override_reason"
                        placeholder="e.g. Covering the night rotation for a team event"
                        value={overrideReason}
                        onChange={(event) => setOverrideReason(event.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        onClick={submitShiftOverride}
                        disabled={
                          !overrideShiftId ||
                          !overrideDate ||
                          !overrideReason.trim() ||
                          createShiftOverride.isPending
                        }
                      >
                        {createShiftOverride.isPending ? "Saving…" : "Set one-day change"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="salary" className="pt-6">
              <EmployeeSalarySection employeeId={employeeId} employeeName={employee.full_name} />
            </TabsContent>

            <TabsContent value="documents" className="pt-6">
              <EmployeeDocumentsSection employeeId={employeeId} />
            </TabsContent>

            {/* Status */}
            <TabsContent value="status" className="pt-6">
              <Card className="max-w-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Employment status</CardTitle>
                  <CardDescription>
                    Moving someone to Suspended or Terminated restricts their access straight away.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                    <RailLabel>Current</RailLabel>
                    <EmployeeStatusBadge status={employee.status} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium text-foreground">Change status to</label>
                    <Select
                      value={pendingStatus ?? undefined}
                      onValueChange={(value) => setPendingStatus(value as EmployeeStatus)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter((option) => option.value !== employee.status).map(
                          (option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {(pendingStatus === "TERMINATED" || pendingStatus === "SUSPENDED") && (
                    <Alert variant="destructive">
                      <ShieldAlertIcon className="size-4" />
                      <AlertDescription>
                        {employee.full_name} loses system access as soon as this is saved.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-2">
                    <label htmlFor="status_reason" className="block text-sm font-medium text-foreground">
                      Reason <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      id="status_reason"
                      placeholder="What's changing, and why"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Saved to this person&apos;s status history and the audit log.
                    </p>
                  </div>

                  <Button
                    variant={pendingStatus === "TERMINATED" ? "destructive" : "default"}
                    onClick={submitStatusChange}
                    disabled={!pendingStatus || !reason.trim() || updateStatus.isPending}
                  >
                    {updateStatus.isPending ? "Updating…" : "Update status"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog
        open={pendingTeamId !== null}
        onOpenChange={(open) => !open && setPendingTeamId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Move {employee.full_name} to {pendingTeamName ?? "this team"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Their current team assignment ends today and the new one starts. The change is logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTransfer}>Move employee</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingShiftId !== null}
        onOpenChange={(open) => !open && setPendingShiftId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Set {pendingShiftName ?? "this shift"} as the regular shift?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {employee.full_name} will be scheduled on {pendingShiftName ?? "the selected shift"}{" "}
              from today. Their previous shift assignment ends.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAssignShift}>Assign shift</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
