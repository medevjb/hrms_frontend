"use client";

import { useState } from "react";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { formatTimeInTimezone } from "@/lib/format-time";
import { useAttendanceList } from "@/services/attendance";
import type { AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import { AdjustAttendanceDialog } from "./AdjustAttendanceDialog";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "PRESENT", label: "Present" },
  { value: "LATE", label: "Late" },
  { value: "ABSENT", label: "Absent" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "WEEKEND", label: "Weekend" },
  { value: "HALF_DAY", label: "Half day" },
  { value: "MISSING_CHECKOUT", label: "Missing checkout" },
];

const STATUS_TONE: Record<AttendanceStatus, StatusTone> = {
  PRESENT: "success",
  LATE: "warning",
  ABSENT: "danger",
  ON_LEAVE: "info",
  HOLIDAY: "info",
  WEEKEND: "neutral",
  HALF_DAY: "warning",
  MISSING_CHECKOUT: "danger",
};

export function AttendanceList() {
  const user = useCurrentUser();
  const canCorrect = user.permissions.includes("attendance.correct");

  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [status, setStatus] = useState<AttendanceStatus | "all">("all");
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);

  const { data, isLoading } = useAttendanceList({
    date_from: dateFrom ?? undefined,
    date_to: dateTo ?? undefined,
    status: status === "all" ? undefined : status,
  });

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Everyone's attendance within your visibility — filter by date, status, or team."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">From</p>
          <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Any date" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">To</p>
          <DatePicker value={dateTo} onChange={setDateTo} placeholder="Any date" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus | "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <PageLoadingSkeleton />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="No attendance records" description="Nothing matches these filters yet." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Status</TableHead>
                {canCorrect && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">{record.employee.full_name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{record.employee.employee_code}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{record.work_date}</TableCell>
                  <TableCell>{record.shift?.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {record.check_in ? formatTimeInTimezone(record.check_in, user.organization.timezone) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {record.check_out ? formatTimeInTimezone(record.check_out, user.organization.timezone) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {record.late_minutes !== null ? `${record.late_minutes}m` : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <StatusChip tone={STATUS_TONE[record.status]}>{record.status.replace("_", " ")}</StatusChip>
                      {record.is_manual_adjustment && (
                        <span className="text-xs text-muted-foreground" title="Manually corrected">
                          ✎
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {canCorrect && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(record)}
                        aria-label="Correct attendance"
                      >
                        <PencilIcon />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdjustAttendanceDialog record={editing} onClose={() => setEditing(null)} />
    </>
  );
}
