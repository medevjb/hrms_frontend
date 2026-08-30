"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useOvertimeRecords, type OvertimeFilters } from "@/services/overtime";
import type { OvertimeRecord, OvertimeStatus } from "@/types/overtime";
import { AdjustOvertimeDialog } from "./AdjustOvertimeDialog";
import { DecideOvertimeDialog, type DecideMode } from "./DecideOvertimeDialog";

const STATUS_TONE: Record<OvertimeStatus, StatusTone> = {
  DETECTED: "neutral",
  PENDING_TEAM_LEADER: "info",
  PENDING_OPERATION_MANAGER: "info",
  PENDING_HR: "info",
  APPROVED: "success",
  REJECTED: "danger",
  PAYROLL_PROCESSED: "neutral",
};

function hours(minutes: number): string {
  return `${(minutes / 60).toFixed(1)}h`;
}

export function OvertimeRecordsList({ mode }: { mode: "mine" | "pending_approval" | "all" }) {
  const user = useCurrentUser();
  const canAdjust = user.permissions.includes("overtime.adjust");

  const filters: OvertimeFilters =
    mode === "mine" ? { mine: true } : mode === "pending_approval" ? { pending_my_approval: true } : {};

  const { data, isLoading } = useOvertimeRecords(filters);
  const [decision, setDecision] = useState<{ record: OvertimeRecord; mode: DecideMode } | null>(null);
  const [adjusting, setAdjusting] = useState<OvertimeRecord | null>(null);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        title="No overtime records"
        description={
          mode === "pending_approval"
            ? "Nothing is waiting on your approval right now."
            : "Weekend and holiday work shows up here once the nightly attendance close runs."
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              {mode !== "mine" && <TableHead>Employee</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Worked</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((record) => (
              <TableRow key={record.id}>
                {mode !== "mine" && (
                  <TableCell>
                    <div className="font-medium">{record.employee.full_name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {record.employee.employee_code}
                    </div>
                  </TableCell>
                )}
                <TableCell className="font-mono text-sm">{record.work_date}</TableCell>
                <TableCell>{record.type === "WEEKEND" ? "Weekend" : "Holiday"}</TableCell>
                <TableCell className="font-mono text-sm">{hours(record.worked_minutes)}</TableCell>
                <TableCell className="font-mono text-sm">
                  {record.effective_overtime_days}
                  {record.manual_days_override !== null && (
                    <span className="ml-1 text-xs text-muted-foreground">(adjusted)</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusChip tone={STATUS_TONE[record.status]}>
                    {record.status.replace(/_/g, " ")}
                  </StatusChip>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {record.current_stage ? record.current_stage.replace(/_/g, " ") : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {mode === "pending_approval" && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setDecision({ record, mode: "approve" })}>
                          Approve
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDecision({ record, mode: "reject" })}>
                          Reject
                        </Button>
                      </>
                    )}
                    {mode === "all" && canAdjust && record.status !== "PAYROLL_PROCESSED" && (
                      <Button variant="ghost" size="sm" onClick={() => setAdjusting(record)}>
                        Adjust
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DecideOvertimeDialog
        record={decision?.record ?? null}
        mode={decision?.mode ?? "approve"}
        onClose={() => setDecision(null)}
      />
      <AdjustOvertimeDialog record={adjusting} onClose={() => setAdjusting(null)} />
    </>
  );
}
