"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useCancelLeaveRequest, useLeaveRequests, type LeaveRequestFilters } from "@/services/leave";
import type { LeaveRequest, LeaveStatus } from "@/types/leave";
import { DecideLeaveRequestDialog, type DecideMode } from "./DecideLeaveRequestDialog";

const STATUS_TONE: Record<LeaveStatus, StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  TEAM_LEADER_APPROVED: "info",
  OPERATION_MANAGER_APPROVED: "info",
  HR_APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

const CANCELLABLE: LeaveStatus[] = [
  "SUBMITTED",
  "TEAM_LEADER_APPROVED",
  "OPERATION_MANAGER_APPROVED",
  "HR_APPROVED",
];

function CancelButton({ leaveRequest }: { leaveRequest: LeaveRequest }) {
  const cancel = useCancelLeaveRequest(leaveRequest.id);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={cancel.isPending}
      onClick={() =>
        cancel.mutate(undefined, {
          onSuccess: () => toast.success("Leave request cancelled"),
          onError: () => toast.error("Cancel failed"),
        })
      }
    >
      Cancel
    </Button>
  );
}

export function LeaveRequestsList({ mode }: { mode: "mine" | "pending_approval" | "all" }) {
  const user = useCurrentUser();
  const canDirectApprove = user.permissions.includes("leave.override");

  const filters: LeaveRequestFilters =
    mode === "mine" ? { mine: true } : mode === "pending_approval" ? { pending_my_approval: true } : {};

  const { data, isLoading } = useLeaveRequests(filters);
  const [decision, setDecision] = useState<{ request: LeaveRequest; mode: DecideMode } | null>(null);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        title="No leave requests"
        description={mode === "pending_approval" ? "Nothing is waiting on you right now." : "Nothing here yet."}
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {mode !== "mine" && <TableHead>Employee</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((request) => (
              <TableRow key={request.id}>
                {mode !== "mine" && (
                  <TableCell>
                    <div className="font-medium">{request.employee.full_name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{request.employee.employee_code}</div>
                  </TableCell>
                )}
                <TableCell>{request.leave_type.name}</TableCell>
                <TableCell className="font-mono text-sm">
                  {request.start_date}
                  {request.start_date !== request.end_date ? ` – ${request.end_date}` : ""}
                  {request.is_half_day && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({request.half_day_period === "FIRST_HALF" ? "1st half" : "2nd half"})
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">{request.days_requested}</TableCell>
                <TableCell>
                  <StatusChip tone={STATUS_TONE[request.status]}>{request.status.replace(/_/g, " ")}</StatusChip>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {request.current_stage ? request.current_stage.replace(/_/g, " ") : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {mode === "pending_approval" && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setDecision({ request, mode: "approve" })}>
                          Approve
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDecision({ request, mode: "reject" })}>
                          Reject
                        </Button>
                        {canDirectApprove && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDecision({ request, mode: "direct-approve" })}
                          >
                            Direct approve
                          </Button>
                        )}
                      </>
                    )}
                    {mode === "mine" && CANCELLABLE.includes(request.status) && (
                      <CancelButton leaveRequest={request} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DecideLeaveRequestDialog
        leaveRequest={decision?.request ?? null}
        mode={decision?.mode ?? "approve"}
        onClose={() => setDecision(null)}
      />
    </>
  );
}
