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

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From date</p>
          <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Any date" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To date</p>
          <DatePicker value={dateTo} onChange={setDateTo} placeholder="Any date" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
          <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus | "all")}>
            <SelectTrigger className="w-48">
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
      </div>

      {isLoading ? (
        <PageLoadingSkeleton />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="No attendance records" description="Nothing matches these filters yet." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
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
                {canCorrect && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {record.employee.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{record.employee.full_name}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{record.employee.employee_code}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">{record.work_date}</TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground">{record.shift?.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-foreground">
                    {record.check_in ? formatTimeInTimezone(record.check_in, user.organization.timezone) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground">
                    {record.check_out ? formatTimeInTimezone(record.check_out, user.organization.timezone) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {record.late_minutes !== null && record.late_minutes > 0 ? (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">{record.late_minutes}m</span>
                    ) : (
                      "—"
                    )}
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(record)}
                        aria-label="Correct attendance"
                        className="rounded-lg hover:bg-muted"
                      >
                        <PencilIcon className="size-3.5 text-muted-foreground" />
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
