"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  DollarSignIcon,
  FolderIcon,
  MailIcon,
  MapPinIcon,
  PhoneCallIcon,
  PhoneIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  UserCheckIcon,
  UserIcon,
  UsersIcon,
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
import { Badge } from "@/components/ui/badge";
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
import { useCreateShiftOverride } from "@/services/shifts";
import { useTeams } from "@/services/teams";
import type { EmployeeStatus } from "@/types/organization";
import { EmployeeDocumentsSection } from "./EmployeeDocumentsSection";
import { EmployeeSalarySection } from "./EmployeeSalarySection";
import { EmployeeStatusBadge } from "./EmployeeStatusBadge";

const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "PROBATION", label: "Probation" },
  { value: "NOTICE_PERIOD", label: "Notice Period" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "ARCHIVED", label: "Archived" },
];

function getInitials(name: string): string {
  if (!name) return "EM";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50">
      {Icon && <Icon className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate mt-0.5">{value ?? "—"}</p>
      </div>
    </div>
  );
}

export function EmployeeDetail({ employeeId }: { employeeId: number }) {
  const { data: employee, isLoading, error } = useEmployee(employeeId);
  const { data: teams } = useTeams();
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

  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const [pendingShiftId, setPendingShiftId] = useState<string | null>(null);

  if (isLoading) return <PageLoadingSkeleton />;

  if (error || !employee) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/employees">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Employees
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>
            This employee couldn&apos;t be found, or you don&apos;t have access to view their details.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  function handleCopy(text: string, fieldName: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function confirmTransfer() {
    if (!pendingTeamId) return;

    transferEmployee.mutate(
      { team_id: Number(pendingTeamId) },
      {
        onSuccess: () => toast.success("Employee transferred successfully"),
        onError: () => toast.error("Transfer failed"),
        onSettled: () => setPendingTeamId(null),
      },
    );
  }

  function confirmAssignShift() {
    if (!pendingShiftId) return;

    assignShift.mutate(
      { shift_id: Number(pendingShiftId) },
      {
        onSuccess: () => toast.success("Shift assigned successfully"),
        onError: () => toast.error("Shift assignment failed"),
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
          toast.success("Employee status updated");
          setReason("");
          setPendingStatus(null);
        },
        onError: () => toast.error("Status update failed"),
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
          toast.success("One-day shift override set successfully");
          setOverrideShiftId(null);
          setOverrideDate(null);
          setOverrideReason("");
        },
        onError: () => toast.error("Couldn't set the shift change"),
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
          <Link href="/employees">
            <ArrowLeftIcon className="size-4" />
            <span>Back to Employees</span>
          </Link>
        </Button>
      </div>

      {/* Hero Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8">
        <div className="absolute top-0 right-0 h-32 w-64 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Main Info */}
          <div className="flex items-start sm:items-center gap-5">
            <Avatar className="size-20 sm:size-24 border-2 border-background shadow-md">
              <AvatarImage src={employee.profile_image_path ?? undefined} alt={employee.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl sm:text-2xl">
                {getInitials(employee.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {employee.full_name}
                </h1>
                <EmployeeStatusBadge status={employee.status} />
              </div>

              <p className="text-base text-muted-foreground font-medium">{employee.designation}</p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className="font-mono text-xs">
                  {employee.employee_code}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {employee.employment_type.replace("_", " ")}
                </Badge>
                {employee.office_location && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <MapPinIcon className="size-3 text-muted-foreground" />
                    {employee.office_location}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            {employee.email && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleCopy(employee.email, "email")}
              >
                {copiedField === "email" ? (
                  <CheckIcon className="size-3.5 text-emerald-600" />
                ) : (
                  <MailIcon className="size-3.5 text-muted-foreground" />
                )}
                <span className="max-w-[160px] truncate">{employee.email}</span>
                <CopyIcon className="size-3 text-muted-foreground opacity-60 ml-0.5" />
              </Button>
            )}

            {employee.phone && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleCopy(employee.phone!, "phone")}
              >
                {copiedField === "phone" ? (
                  <CheckIcon className="size-3.5 text-emerald-600" />
                ) : (
                  <PhoneIcon className="size-3.5 text-muted-foreground" />
                )}
                <span>{employee.phone}</span>
                <CopyIcon className="size-3 text-muted-foreground opacity-60 ml-0.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Quick KPI Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-border/60">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2Icon className="size-3.5 text-primary" />
              Dept & Team
            </span>
            <p className="text-sm font-semibold text-foreground truncate mt-1">
              {employee.department?.name ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {employee.team?.name ? `Team ${employee.team.name}` : "No Team"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ClockIcon className="size-3.5 text-amber-500" />
              Regular Shift
            </span>
            <p className="text-sm font-semibold text-foreground truncate mt-1">
              {employee.current_shift?.name ?? "Unassigned"}
            </p>
            <p className="text-xs text-muted-foreground">
              {employee.overtime_eligible ? "OT Eligible" : "No OT"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 text-blue-500" />
              Joined Date
            </span>
            <p className="text-sm font-semibold text-foreground truncate mt-1">
              {employee.joining_date}
            </p>
            <p className="text-xs text-muted-foreground">
              {employee.confirmation_date ? `Confirmed ${employee.confirmation_date}` : "Probation"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <UserCheckIcon className="size-3.5 text-purple-500" />
              Manager
            </span>
            <p className="text-sm font-semibold text-foreground truncate mt-1">
              {employee.team_leader?.full_name ?? employee.operation_manager?.full_name ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {employee.team_leader ? "Team Lead" : employee.operation_manager ? "Ops Manager" : "None"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabbed Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/60 p-1 border border-border rounded-xl">
          <TabsTrigger value="overview" className="gap-2 text-xs font-medium rounded-lg">
            <UserIcon className="size-3.5" />
            Overview & Profile
          </TabsTrigger>
          <TabsTrigger value="shifts" className="gap-2 text-xs font-medium rounded-lg">
            <ClockIcon className="size-3.5" />
            Shift & Team
          </TabsTrigger>
          <TabsTrigger value="salary" className="gap-2 text-xs font-medium rounded-lg">
            <DollarSignIcon className="size-3.5" />
            Salary
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 text-xs font-medium rounded-lg">
            <FolderIcon className="size-3.5" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-2 text-xs font-medium rounded-lg">
            <ShieldAlertIcon className="size-3.5" />
            Status Management
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal & Contact Details */}
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserIcon className="size-4 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid gap-3 sm:grid-cols-2">
                <DetailRow label="Full Name" value={employee.full_name} />
                <DetailRow label="Employee Code" value={employee.employee_code} />
                <DetailRow label="Email Address" value={employee.email} icon={MailIcon} />
                <DetailRow label="Phone Number" value={employee.phone} icon={PhoneIcon} />
                <DetailRow label="Joining Date" value={employee.joining_date} icon={CalendarIcon} />
                <DetailRow label="Confirmation Date" value={employee.confirmation_date} icon={CalendarIcon} />
                <DetailRow label="Office Location" value={employee.office_location} icon={MapPinIcon} />
                <DetailRow label="Timezone" value={employee.timezone} icon={ClockIcon} />
                <div className="sm:col-span-2">
                  <DetailRow label="Residential Address" value={employee.address} icon={MapPinIcon} />
                </div>
              </CardContent>
            </Card>

            {/* Work & Organizational Info */}
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BriefcaseIcon className="size-4 text-primary" />
                  Work & Organizational Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid gap-3 sm:grid-cols-2">
                <DetailRow label="Designation" value={employee.designation} />
                <DetailRow
                  label="Employment Type"
                  value={employee.employment_type.replace("_", " ")}
                />
                <DetailRow label="Department" value={employee.department?.name} icon={Building2Icon} />
                <DetailRow label="Team" value={employee.team?.name} icon={UsersIcon} />
                <DetailRow
                  label="Team Leader"
                  value={employee.team_leader?.full_name}
                  icon={UserCheckIcon}
                />
                <DetailRow
                  label="Operation Manager"
                  value={employee.operation_manager?.full_name}
                  icon={UserCheckIcon}
                />
                <DetailRow
                  label="Assigned Shift"
                  value={employee.current_shift?.name}
                  icon={ClockIcon}
                />
                <DetailRow
                  label="Overtime Eligible"
                  value={employee.overtime_eligible ? "Yes (Eligible)" : "No"}
                />
              </CardContent>
            </Card>
          </div>

          {/* Emergency Contact Card */}
          <Card className="shadow-sm border border-border">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PhoneCallIcon className="size-4 text-rose-500" />
                Emergency Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {employee.emergency_contact_name || employee.emergency_contact_phone ? (
                <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
                  <DetailRow label="Contact Name" value={employee.emergency_contact_name} />
                  <DetailRow
                    label="Emergency Phone"
                    value={
                      employee.emergency_contact_phone ? (
                        <a
                          href={`tel:${employee.emergency_contact_phone}`}
                          className="hover:underline text-primary flex items-center gap-1.5"
                        >
                          <PhoneIcon className="size-3.5" />
                          {employee.emergency_contact_phone}
                        </a>
                      ) : null
                    }
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No emergency contact information details provided.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: SHIFTS & TEAM MANAGEMENT */}
        <TabsContent value="shifts" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Shift Assignment Card */}
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ClockIcon className="size-4 text-amber-500" />
                  Regular Shift Assignment
                </CardTitle>
                <CardDescription className="text-xs">
                  Change regular recurring shift assigned to this employee.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Current Regular Shift</p>
                    <p className="text-base font-semibold text-foreground mt-0.5">
                      {employee.current_shift?.name ?? "No shift assigned"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Regular
                  </Badge>
                </div>

                <div className="space-y-3 pt-2">
                  <ShiftSelect label="Select New Shift" value={pendingShiftId} onChange={setPendingShiftId} />
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!pendingShiftId}
                    onClick={() => setPendingShiftId(pendingShiftId)}
                  >
                    Assign Shift
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Team Assignment & Transfer */}
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UsersIcon className="size-4 text-blue-500" />
                  Team Assignment & Transfer
                </CardTitle>
                <CardDescription className="text-xs">
                  Reassign employee to a different team within the organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Current Team & Department</p>
                    <p className="text-base font-semibold text-foreground mt-0.5">
                      {employee.team?.name ?? "No Team assigned"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employee.department?.name ?? "No Dept"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-medium text-foreground">Select New Team</label>
                  <Select value={pendingTeamId ?? undefined} onValueChange={setPendingTeamId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select team for transfer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(teams ?? []).map((team) => (
                        <SelectItem key={team.id} value={String(team.id)}>
                          {team.name} ({team.department.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={!pendingTeamId}
                    onClick={() => setPendingTeamId(pendingTeamId)}
                  >
                    Transfer Employee
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Temporary Single-Day Shift Override */}
          <Card className="shadow-sm border border-border">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <RefreshCwIcon className="size-4 text-purple-500" />
                Temporary One-Day Shift Override
              </CardTitle>
              <CardDescription className="text-xs">
                Changes shift schedule for one specific date only without modifying their regular default shift assignment.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
                <ShiftSelect label="Override Shift" value={overrideShiftId} onChange={setOverrideShiftId} />

                <div className="space-y-1.5">
                  <label htmlFor="override_date" className="text-xs font-medium text-foreground">
                    Override Date
                  </label>
                  <DatePicker id="override_date" value={overrideDate} onChange={setOverrideDate} />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <label htmlFor="override_reason" className="text-xs font-medium text-foreground">
                    Reason for Override
                  </label>
                  <Textarea
                    id="override_reason"
                    placeholder="e.g. Covering night rotation for team event..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="sm:col-span-3 pt-2">
                  <Button
                    onClick={submitShiftOverride}
                    disabled={
                      !overrideShiftId ||
                      !overrideDate ||
                      !overrideReason.trim() ||
                      createShiftOverride.isPending
                    }
                  >
                    {createShiftOverride.isPending ? "Setting..." : "Apply One-Day Shift Change"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: SALARY */}
        <TabsContent value="salary">
          <EmployeeSalarySection employeeId={employeeId} employeeName={employee.full_name} />
        </TabsContent>

        {/* TAB 4: DOCUMENTS */}
        <TabsContent value="documents">
          <EmployeeDocumentsSection employeeId={employeeId} />
        </TabsContent>

        {/* TAB 5: STATUS MANAGEMENT */}
        <TabsContent value="status">
          <Card className="shadow-sm border border-border">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldAlertIcon className="size-4 text-amber-500" />
                Employee Status & Lifecycle Management
              </CardTitle>
              <CardDescription className="text-xs">
                Update employment status (e.g. Probation, Active, Resigned, Terminated).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 max-w-xl">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Current Active Status</p>
                  <div className="mt-1">
                    <EmployeeStatusBadge status={employee.status} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Select New Status</label>
                  <Select
                    value={pendingStatus ?? undefined}
                    onValueChange={(v) => setPendingStatus(v as EmployeeStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose status..." />
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

                {pendingStatus && (pendingStatus === "TERMINATED" || pendingStatus === "SUSPENDED") && (
                  <Alert variant="destructive">
                    <ShieldAlertIcon className="size-4" />
                    <AlertDescription>
                      Changing status to <strong>{pendingStatus}</strong> will restrict system privileges and access for {employee.full_name}.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="status_reason" className="text-xs font-medium text-foreground">
                    Audit Reason for Change <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="status_reason"
                    placeholder="Describe the reason for status change..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  variant={pendingStatus === "TERMINATED" ? "destructive" : "default"}
                  onClick={submitStatusChange}
                  disabled={!pendingStatus || !reason.trim() || updateStatus.isPending}
                >
                  {updateStatus.isPending ? "Updating..." : "Confirm Status Update"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog for Team Transfer */}
      <AlertDialog open={pendingTeamId !== null} onOpenChange={(open) => !open && setPendingTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Team Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move <strong>{employee.full_name}</strong> to the selected team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTransfer}>Confirm Transfer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Shift Assignment */}
      <AlertDialog open={pendingShiftId !== null} onOpenChange={(open) => !open && setPendingShiftId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Shift Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Set this as <strong>{employee.full_name}</strong>&apos;s new regular shift?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAssignShift}>Assign Shift</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

