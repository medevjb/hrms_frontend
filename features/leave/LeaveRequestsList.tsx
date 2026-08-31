"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { EmptyState } from "@/components/ui/EmptyState";
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
import {
  useCancelLeaveRequest,
  useLeaveRequests,
  useLeaveTypes,
  type LeaveRequestFilters,
} from "@/services/leave";
import type { LeaveRequest, LeaveStatus } from "@/types/leave";
import { DecideLeaveRequestDialog, type DecideMode } from "./DecideLeaveRequestDialog";
import { LeaveRequestDetailSheet } from "./LeaveRequestDetailSheet";

const STATUS_TONE: Record<LeaveStatus, StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  TEAM_LEADER_APPROVED: "info",
  OPERATION_MANAGER_APPROVED: "info",
  HR_APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

const STATUS_OPTIONS: LeaveStatus[] = [
  "SUBMITTED",
  "TEAM_LEADER_APPROVED",
  "OPERATION_MANAGER_APPROVED",
  "HR_APPROVED",
  "REJECTED",
  "CANCELLED",
];

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
  const showFilters = mode !== "mine";

  const { data: leaveTypes } = useLeaveTypes();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<LeaveStatus | "all">("all");
  const [leaveTypeId, setLeaveTypeId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  const filters: LeaveRequestFilters = {
    ...(mode === "mine" ? { mine: true } : {}),
    ...(mode === "pending_approval" ? { pending_my_approval: true } : {}),
    ...(showFilters && status !== "all" ? { status } : {}),
    ...(showFilters && leaveTypeId !== "all" ? { leave_type_id: Number(leaveTypeId) } : {}),
    ...(showFilters && dateFrom ? { date_from: dateFrom } : {}),
    ...(showFilters && dateTo ? { date_to: dateTo } : {}),
    page,
  };

  const { data, isLoading } = useLeaveRequests(filters);
  const [decision, setDecision] = useState<{ request: LeaveRequest; mode: DecideMode } | null>(null);
  const [viewing, setViewing] = useState<LeaveRequest | null>(null);

  function resetPageAnd<T>(setter: (value: T) => void) {
    return (value: T) => {
      setPage(1);
      setter(value);
    };
  }

  return (
    <>
      {showFilters && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
          {mode === "all" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
              <Select value={status} onValueChange={resetPageAnd((v) => setStatus(v as LeaveStatus | "all"))}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Leave type</p>
            <Select value={leaveTypeId} onValueChange={resetPageAnd(setLeaveTypeId)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(leaveTypes ?? []).map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From date</p>
            <DatePicker value={dateFrom} onChange={resetPageAnd(setDateFrom)} placeholder="Any date" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To date</p>
            <DatePicker value={dateTo} onChange={resetPageAnd(setDateTo)} placeholder="Any date" />
          </div>
        </div>
      )}

      {isLoading ? (
        <PageLoadingSkeleton />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No leave requests"
          description={
            mode === "pending_approval"
              ? "Nothing is waiting on you right now."
              : "Nothing matches these filters yet."
          }
        />
      ) : (
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
                  <TableRow
                    key={request.id}
                    className="cursor-pointer"
                    onClick={() => setViewing(request)}
                  >
                    {mode !== "mine" && (
                      <TableCell>
                        <div className="font-medium">{request.employee.full_name}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {request.employee.employee_code}
                        </div>
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
                      <StatusChip tone={STATUS_TONE[request.status]}>
                        {request.status.replace(/_/g, " ")}
                      </StatusChip>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {request.current_stage ? request.current_stage.replace(/_/g, " ") : "—"}
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewing(request)}>
                          View
                        </Button>
                        {mode === "pending_approval" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDecision({ request, mode: "approve" })}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDecision({ request, mode: "reject" })}
                            >
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

          {data.meta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeftIcon />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.meta.current_page} of {data.meta.last_page}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))}
                disabled={page >= data.meta.last_page}
                aria-label="Next page"
              >
                <ChevronRightIcon />
              </Button>
            </div>
          )}
        </>
      )}

      <LeaveRequestDetailSheet
        request={viewing}
        context={mode}
        onClose={() => setViewing(null)}
        onDecide={(request, decideMode) => {
          setViewing(null);
          setDecision({ request, mode: decideMode });
        }}
      />

      <DecideLeaveRequestDialog
        leaveRequest={decision?.request ?? null}
        mode={decision?.mode ?? "approve"}
        onClose={() => setDecision(null)}
      />
    </>
  );
}
