"use client";

import { useState } from "react";
import {
  ArrowRightIcon,
  BanIcon,
  CheckIcon,
  CircleDashedIcon,
  MinusIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { fmtDate } from "@/lib/people";
import { useCancelLeaveRequest, useLeaveRequest } from "@/services/leave";
import type {
  LeaveApprovalStage,
  LeaveRequest,
  LeaveRequestApproval,
  LeaveStatus,
} from "@/types/leave";
import type { DecideMode } from "./DecideLeaveRequestDialog";

const STATUS_TONE: Record<LeaveStatus, StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  TEAM_LEADER_APPROVED: "info",
  OPERATION_MANAGER_APPROVED: "info",
  HR_APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

const STAGE_LABEL: Record<LeaveApprovalStage, string> = {
  TEAM_LEADER: "Team Leader",
  OPERATION_MANAGER: "Operation Manager",
  HR: "HR",
  HEAD_HR: "Head of HR",
  ADMIN: "Admin",
};

const TERMINAL: LeaveStatus[] = ["HR_APPROVED", "REJECTED", "CANCELLED"];
const CANCELLABLE: LeaveStatus[] = [
  "SUBMITTED",
  "TEAM_LEADER_APPROVED",
  "OPERATION_MANAGER_APPROVED",
  "HR_APPROVED",
];

type StageState = "approved" | "rejected" | "bypassed" | "current" | "upcoming";

function stageState(
  stage: LeaveApprovalStage,
  request: LeaveRequest,
  approval: LeaveRequestApproval | undefined,
): StageState {
  if (approval) return approval.decision === "APPROVED" ? "approved" : "rejected";
  if (request.bypassed_stages?.includes(stage)) return "bypassed";
  if (request.current_stage === stage && !TERMINAL.includes(request.status)) return "current";
  return "upcoming";
}

const STAGE_ICON: Record<StageState, typeof CheckIcon> = {
  approved: CheckIcon,
  rejected: XIcon,
  bypassed: MinusIcon,
  current: ArrowRightIcon,
  upcoming: CircleDashedIcon,
};

const STAGE_ICON_CLASS: Record<StageState, string> = {
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-destructive/15 text-destructive",
  bypassed: "bg-muted text-muted-foreground",
  current: "bg-primary/15 text-primary",
  upcoming: "bg-muted text-muted-foreground",
};

function Timeline({ request }: { request: LeaveRequest }) {
  const approvalByStage = new Map(request.approvals.map((a) => [a.stage, a]));

  return (
    <ol className="space-y-1">
      <TimelineRow
        icon={CheckIcon}
        iconClass={STAGE_ICON_CLASS.approved}
        title="Submitted"
        meta={fmtDate(request.submitted_at, "d MMM yyyy, HH:mm")}
      />
      {request.required_stages.map((stage) => {
        const approval = approvalByStage.get(stage);
        const state = stageState(stage, request, approval);
        return (
          <TimelineRow
            key={stage}
            icon={STAGE_ICON[state]}
            iconClass={STAGE_ICON_CLASS[state]}
            title={STAGE_LABEL[stage]}
            meta={
              approval
                ? `${approval.decision === "APPROVED" ? "Approved" : "Rejected"} by ${approval.approver.name} · ${fmtDate(approval.decided_at, "d MMM yyyy, HH:mm")}`
                : state === "current"
                  ? "Waiting for decision"
                  : state === "bypassed"
                    ? "Skipped via direct approval"
                    : "Not yet reached"
            }
            note={approval?.reason ?? null}
          />
        );
      })}
      {request.status === "HR_APPROVED" && (
        <TimelineRow
          icon={CheckIcon}
          iconClass={STAGE_ICON_CLASS.approved}
          title={request.is_direct_approval ? "Direct approval" : "Approved"}
          meta={fmtDate(request.decided_at, "d MMM yyyy, HH:mm")}
          note={request.direct_approval_reason}
        />
      )}
      {request.status === "REJECTED" && (
        <TimelineRow
          icon={XIcon}
          iconClass={STAGE_ICON_CLASS.rejected}
          title="Rejected"
          meta={fmtDate(request.decided_at, "d MMM yyyy, HH:mm")}
          note={request.rejection_reason}
        />
      )}
      {request.status === "CANCELLED" && (
        <TimelineRow
          icon={BanIcon}
          iconClass={STAGE_ICON_CLASS.bypassed}
          title="Cancelled"
          meta={fmtDate(request.cancelled_at, "d MMM yyyy, HH:mm")}
        />
      )}
    </ol>
  );
}

function TimelineRow({
  icon: Icon,
  iconClass,
  title,
  meta,
  note,
}: {
  icon: typeof CheckIcon;
  iconClass: string;
  title: string;
  meta: string;
  note?: string | null;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="size-3.5" />
        </span>
        <span className="my-0.5 w-px flex-1 bg-border last:hidden" />
      </div>
      <div className="pb-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
        {note && <p className="mt-1 text-xs text-muted-foreground italic">&ldquo;{note}&rdquo;</p>}
      </div>
    </li>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-foreground">{children || "—"}</dd>
    </div>
  );
}

export function LeaveRequestDetailSheet({
  request,
  context,
  onClose,
  onDecide,
}: {
  request: LeaveRequest | null;
  context: "mine" | "pending_approval" | "all";
  onClose: () => void;
  onDecide: (request: LeaveRequest, mode: DecideMode) => void;
}) {
  const user = useCurrentUser();
  const canDirectApprove = user.permissions.includes("leave.override");
  const { data: fresh } = useLeaveRequest(request?.id ?? null);
  const current = fresh ?? request;
  const cancel = useCancelLeaveRequest(current?.id ?? 0);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isTerminal = current ? TERMINAL.includes(current.status) : true;
  const showApproveReject = context === "pending_approval" && !isTerminal;
  const showDirectApprove = canDirectApprove && !isTerminal && context !== "mine";
  const showCancel = context === "mine" && current !== null && CANCELLABLE.includes(current.status);

  return (
    <>
      <Sheet open={request !== null} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
          {current && (
            <>
              <SheetHeader className="border-b border-border">
                <SheetTitle>{current.employee.full_name}</SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {current.employee.employee_code}
                </SheetDescription>
                <div className="pt-1">
                  <StatusChip tone={STATUS_TONE[current.status]}>
                    {current.status.replace(/_/g, " ")}
                  </StatusChip>
                </div>
              </SheetHeader>

              <div className="space-y-6 p-4">
                <dl className="divide-y divide-border rounded-xl border border-border px-3">
                  <Fact label="Leave type">{current.leave_type.name}</Fact>
                  <Fact label="Dates">
                    {fmtDate(current.start_date)}
                    {current.start_date !== current.end_date ? ` – ${fmtDate(current.end_date)}` : ""}
                  </Fact>
                  <Fact label="Days">
                    {current.days_requested}
                    {current.is_half_day && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({current.half_day_period === "FIRST_HALF" ? "1st half" : "2nd half"})
                      </span>
                    )}
                  </Fact>
                  <Fact label="Reason">{current.reason}</Fact>
                </dl>

                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Approval chain
                  </p>
                  <Timeline request={current} />
                </div>
              </div>

              {(showApproveReject || showDirectApprove || showCancel) && (
                <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-popover p-4">
                  {showApproveReject && (
                    <>
                      <Button size="sm" onClick={() => onDecide(current, "approve")}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDecide(current, "reject")}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {showDirectApprove && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDecide(current, "direct-approve")}
                    >
                      Direct approve
                    </Button>
                  )}
                  {showCancel && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={cancel.isPending}
                      onClick={() => setConfirmCancel(true)}
                    >
                      Cancel request
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this leave request?"
        description="The request is withdrawn and any held balance is released. This cannot be undone."
        confirmLabel="Cancel request"
        destructive
        onConfirm={async () => {
          await cancel.mutateAsync(undefined, {
            onSuccess: () => {
              toast.success("Leave request cancelled");
              onClose();
            },
            onError: () => toast.error("Cancel failed"),
          });
        }}
      />
    </>
  );
}
