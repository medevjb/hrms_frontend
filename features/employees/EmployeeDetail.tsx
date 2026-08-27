"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
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
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm">{value ?? "—"}</Text>
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

  if (isLoading) return <PageLoadingSkeleton />;

  if (error || !employee) {
    return (
      <Alert color="red" icon={<IconAlertCircle size={18} />}>
        This employee couldn&apos;t be found, or you don&apos;t have access to it.
      </Alert>
    );
  }

  function confirmTransfer(teamId: string | null) {
    if (!teamId) return;

    modals.openConfirmModal({
      title: "Transfer employee",
      children: <Text size="sm">Move {employee!.full_name} to this team?</Text>,
      labels: { confirm: "Transfer", cancel: "Cancel" },
      onConfirm: () => {
        transferEmployee.mutate(
          { team_id: Number(teamId) },
          {
            onSuccess: () => notifications.show({ message: "Employee transferred", color: "green" }),
            onError: () => notifications.show({ message: "Transfer failed", color: "red" }),
          },
        );
      },
    });
  }

  function submitStatusChange() {
    if (!pendingStatus || !reason.trim()) return;

    updateStatus.mutate(
      { status: pendingStatus, reason },
      {
        onSuccess: () => {
          notifications.show({ message: "Status updated", color: "green" });
          setReason("");
          setPendingStatus(null);
        },
        onError: () => notifications.show({ message: "Status update failed", color: "red" }),
      },
    );
  }

  function confirmAssignShift(shiftId: string | null) {
    if (!shiftId) return;

    modals.openConfirmModal({
      title: "Assign shift",
      children: <Text size="sm">Make this {employee!.full_name}&apos;s regular shift?</Text>,
      labels: { confirm: "Assign", cancel: "Cancel" },
      onConfirm: () => {
        assignShift.mutate(
          { shift_id: Number(shiftId) },
          {
            onSuccess: () => notifications.show({ message: "Shift assigned", color: "green" }),
            onError: () => notifications.show({ message: "Shift assignment failed", color: "red" }),
          },
        );
      },
    });
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
          notifications.show({ message: "One-day shift change set", color: "green" });
          setOverrideShiftId(null);
          setOverrideDate(null);
          setOverrideReason("");
        },
        onError: () => notifications.show({ message: "Couldn't set the shift change", color: "red" }),
      },
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>{employee.full_name}</Title>
          <Text c="dimmed">{employee.designation}</Text>
        </div>
        <EmployeeStatusBadge status={employee.status} />
      </Group>

      <Card withBorder>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          <InfoField label="Employee code" value={employee.employee_code} />
          <InfoField label="Email" value={employee.email} />
          <InfoField label="Phone" value={employee.phone} />
          <InfoField label="Joining date" value={employee.joining_date} />
          <InfoField label="Employment type" value={employee.employment_type.replace("_", " ")} />
          <InfoField
            label="Overtime eligible"
            value={employee.overtime_eligible ? "Yes" : "No"}
          />
          <InfoField label="Department" value={employee.department?.name} />
          <InfoField label="Team" value={employee.team?.name} />
          <InfoField label="Team leader" value={employee.team_leader?.full_name} />
          <InfoField label="Operation manager" value={employee.operation_manager?.full_name} />
          <InfoField label="Shift" value={employee.current_shift?.name} />
        </SimpleGrid>
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          Team
        </Title>
        <Select
          label="Transfer to a different team"
          placeholder="Select a team"
          data={(teams ?? []).map((team) => ({
            value: String(team.id),
            label: `${team.name} (${team.department.name})`,
          }))}
          onChange={confirmTransfer}
          disabled={transferEmployee.isPending}
          searchable
        />
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          Shift
        </Title>
        <ShiftSelect label="Assign regular shift" value={null} onChange={confirmAssignShift} />
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          Temporary shift change
        </Title>
        <Text size="sm" c="dimmed" mb="sm">
          Changes the shift for one specific day only — the regular assignment above is
          unaffected.
        </Text>
        <Stack gap="sm" maw={420}>
          <ShiftSelect label="Shift for that day" value={overrideShiftId} onChange={setOverrideShiftId} />
          <DateInput label="Date" value={overrideDate} onChange={setOverrideDate} />
          <Textarea
            label="Reason"
            value={overrideReason}
            onChange={(event) => setOverrideReason(event.currentTarget.value)}
          />
          <Button
            onClick={submitShiftOverride}
            disabled={!overrideShiftId || !overrideDate || !overrideReason.trim()}
            loading={createShiftOverride.isPending}
          >
            Set one-day shift change
          </Button>
        </Stack>
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          Change status
        </Title>
        <Stack gap="sm" maw={420}>
          <Select
            label="New status"
            data={STATUS_OPTIONS.filter((option) => option.value !== employee.status)}
            value={pendingStatus}
            onChange={(value) => setPendingStatus(value as EmployeeStatus | null)}
          />
          <Textarea
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.currentTarget.value)}
          />
          <Button
            onClick={submitStatusChange}
            disabled={!pendingStatus || !reason.trim()}
            loading={updateStatus.isPending}
          >
            Update status
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}
