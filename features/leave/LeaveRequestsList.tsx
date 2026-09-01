"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
import { fmtDate } from "@/lib/people";
import {
  useCancelLeaveRequest,
  useLeaveRequests,
  useLeaveTypes,
  type LeaveRequestFilters,
} from "@/services/leave";
import type { LeaveApprovalStage, LeaveRequest, LeaveStatus } from "@/types/leave";
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

const STATUS_LABEL: Record<LeaveStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  TEAM_LEADER_APPROVED: "TL approved",
  OPERATION_MANAGER_APPROVED: "OM approved",
  HR_APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const STAGE_LABEL: Record<LeaveApprovalStage, string> = {
  TEAM_LEADER: "team leader",
  OPERATION_MANAGER: "operation manager",
  HR: "HR",
  HEAD_HR: "Head of HR",
  ADMIN: "admin",
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
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={cancel.isPending}
        onClick={() => setConfirming(true)}
      >
        Cancel
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Cancel this leave request?"
        description="The request is withdrawn and any held balance is released. This can't be undone."
        confirmLabel="Cancel request"
        destructive
        onConfirm={async () => {
          try {
            await cancel.mutateAsync(undefined);
            toast.success("Leave request cancelled");
          } catch {
            toast.error("Couldn't cancel the request — try again");
          }
        }}
      />
    </>
  );
}

function dateRange(request: LeaveRequest): string {
  const start = fmtDate(request.start_date, "d MMM");
  if (request.start_date === request.end_date) {
    return request.is_half_day
      ? `${start} · ${request.half_day_period === "FIRST_HALF" ? "1st half" : "2nd half"}`
      : start;
  }
  return `${start} – ${fmtDate(request.end_date, "d MMM")}`;
}

export function LeaveRequestsList({ mode }: { mode: "mine" | "pending_approval" | "all" }) {
  const user = useCurrentUser();
  const canDirectApprove = user.permissions.includes("leave.override");
  const showStatusFilter = mode !== "pending_approval";

  const { data: leaveTypes } = useLeaveTypes();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<LeaveStatus | "all">("all");
  const [leaveTypeId, setLeaveTypeId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  const hasActiveFilters =
    status !== "all" || leaveTypeId !== "all" || dateFrom !== null || dateTo !== null;

  const filters: LeaveRequestFilters = {
    ...(mode === "mine" ? { mine: true } : {}),
    ...(mode === "pending_approval" ? { pending_my_approval: true } : {}),
    ...(showStatusFilter && status !== "all" ? { status } : {}),
    ...(leaveTypeId !== "all" ? { leave_type_id: Number(leaveTypeId) } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
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

  function clearFilters() {
    setPage(1);
    setStatus("all");
    setLeaveTypeId("all");
    setDateFrom(null);
    setDateTo(null);
  }

  const showEmployee = mode !== "mine";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {showStatusFilter && (
          <Select value={status} onValueChange={resetPageAnd((v) => setStatus(v as LeaveStatus | "all"))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {STATUS_LABEL[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={leaveTypeId} onValueChange={resetPageAnd(setLeaveTypeId)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any type</SelectItem>
            {(leaveTypes ?? []).map((type) => (
              <SelectItem key={type.id} value={String(type.id)}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-36">
          <DatePicker value={dateFrom} onChange={resetPageAnd(setDateFrom)} placeholder="From" />
        </div>
        <div className="w-36">
          <DatePicker value={dateTo} onChange={resetPageAnd(setDateTo)} placeholder="To" />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XIcon />
            Clear
          </Button>
        )}

        {data && (
          <span className="ml-auto text-xs text-muted-foreground">
            {data.meta.total} request{data.meta.total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {isLoading ? (
        <PageLoadingSkeleton />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No matching requests" : "No leave requests"}
          description={
            hasActiveFilters
              ? "Nothing matches these filters. Try clearing them."
              : mode === "pending_approval"
                ? "Nothing is waiting on you right now."
                : mode === "mine"
                  ? "You haven't requested any time off yet."
                  : "No one has requested leave yet."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  {showEmployee && <TableHead>Employee</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
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
                    {showEmployee && (
                      <TableCell>
                        <div className="font-medium">{request.employee.full_name}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {request.employee.employee_code}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{request.leave_type.name}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{dateRange(request)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {request.days_requested}
                    </TableCell>
                    <TableCell>
                      <StatusChip tone={STATUS_TONE[request.status]}>
                        {STATUS_LABEL[request.status]}
                      </StatusChip>
                      {request.current_stage && (
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          waiting on {STAGE_LABEL[request.current_stage]}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {request.submitted_at ? fmtDate(request.submitted_at, "d MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end gap-1">
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
