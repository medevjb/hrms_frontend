"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  { value: "NOTICE_PERIOD", label: "Notice period" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "ARCHIVED", label: "Archived" },
];

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value ?? "—"}</p>
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
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertDescription>
          This employee couldn&apos;t be found, or you don&apos;t have access to it.
        </AlertDescription>
      </Alert>
    );
  }

  function confirmTransfer() {
    if (!pendingTeamId) return;

    transferEmployee.mutate(
      { team_id: Number(pendingTeamId) },
      {
        onSuccess: () => toast.success("Employee transferred"),
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
        onSuccess: () => toast.success("Shift assigned"),
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
          toast.success("Status updated");
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
          toast.success("One-day shift change set");
          setOverrideShiftId(null);
          setOverrideDate(null);
          setOverrideReason("");
        },
        onError: () => toast.error("Couldn't set the shift change"),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {employee.full_name}
          </h1>
          <p className="text-sm text-muted-foreground">{employee.designation}</p>
        </div>
        <EmployeeStatusBadge status={employee.status} />
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <InfoField label="Employee code" value={employee.employee_code} />
          <InfoField label="Email" value={employee.email} />
          <InfoField label="Phone" value={employee.phone} />
          <InfoField label="Joining date" value={employee.joining_date} />
          <InfoField label="Employment type" value={employee.employment_type.replace("_", " ")} />
          <InfoField label="Overtime eligible" value={employee.overtime_eligible ? "Yes" : "No"} />
          <InfoField label="Department" value={employee.department?.name} />
          <InfoField label="Team" value={employee.team?.name} />
          <InfoField label="Team leader" value={employee.team_leader?.full_name} />
          <InfoField label="Operation manager" value={employee.operation_manager?.full_name} />
          <InfoField label="Shift" value={employee.current_shift?.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={pendingTeamId ?? undefined} onValueChange={setPendingTeamId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Transfer to a different team" />
            </SelectTrigger>
            <SelectContent>
              {(teams ?? []).map((team) => (
                <SelectItem key={team.id} value={String(team.id)}>
                  {team.name} ({team.department.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shift</CardTitle>
        </CardHeader>
        <CardContent>
          <ShiftSelect label="" value={pendingShiftId} onChange={setPendingShiftId} />
        </CardContent>
      </Card>

      <EmployeeSalarySection employeeId={employeeId} employeeName={employee.full_name} />

      <EmployeeDocumentsSection employeeId={employeeId} />

      <Card>
        <CardHeader>
          <CardTitle>Temporary shift change</CardTitle>
          <p className="text-sm text-muted-foreground">
            Changes the shift for one specific day only — the regular assignment above is
            unaffected.
          </p>
        </CardHeader>
        <CardContent className="max-w-sm space-y-3">
          <ShiftSelect label="Shift for that day" value={overrideShiftId} onChange={setOverrideShiftId} />
          <div className="space-y-1.5">
            <label htmlFor="override_date" className="text-sm font-medium">
              Date
            </label>
            <DatePicker id="override_date" value={overrideDate} onChange={setOverrideDate} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="override_reason" className="text-sm font-medium">
              Reason
            </label>
            <Textarea
              id="override_reason"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          </div>
          <Button
            onClick={submitShiftOverride}
            disabled={!overrideShiftId || !overrideDate || !overrideReason.trim() || createShiftOverride.isPending}
          >
            Set one-day shift change
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change status</CardTitle>
        </CardHeader>
        <CardContent className="max-w-sm space-y-3">
          <Select
            value={pendingStatus ?? undefined}
            onValueChange={(v) => setPendingStatus(v as EmployeeStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="New status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.filter((option) => option.value !== employee.status).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-1.5">
            <label htmlFor="status_reason" className="text-sm font-medium">
              Reason
            </label>
            <Textarea id="status_reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <Button
            onClick={submitStatusChange}
            disabled={!pendingStatus || !reason.trim() || updateStatus.isPending}
          >
            Update status
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={pendingTeamId !== null} onOpenChange={(open) => !open && setPendingTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer employee</AlertDialogTitle>
            <AlertDialogDescription>
              Move {employee.full_name} to this team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTransfer}>Transfer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingShiftId !== null} onOpenChange={(open) => !open && setPendingShiftId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign shift</AlertDialogTitle>
            <AlertDialogDescription>
              Make this {employee.full_name}&apos;s regular shift?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAssignShift}>Assign</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
