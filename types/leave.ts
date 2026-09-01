// Mirrors backend/app/Http/Resources/Api/V1/Leave*.php and
// App\Enums\Leave*.php (docs/PRD.md §34-§41, §138, §144).

export type LeaveAccrualMode = "UPFRONT" | "MONTHLY";

export type LeaveType = {
  id: number;
  name: string;
  code: string;
  annual_allocation_days: number;
  is_paid: boolean;
  supports_half_day: boolean;
  carry_forward_enabled: boolean;
  carry_forward_cap_days: number | null;
  requires_document: boolean;
  max_consecutive_days: number | null;
  min_employment_days: number | null;
  accrual_mode: LeaveAccrualMode;
  is_active: boolean;
};

export type LeaveBalance = {
  id: number;
  employee_id: number;
  leave_type: { id: number; name: string; code: string };
  leave_year: number;
  balance: number;
  // entitlement = the leave type's annual allocation; taken is approximate
  // (entitlement − balance), matching the dashboard widget.
  entitlement: number;
  taken: number;
};

export type BulkLeaveBalanceMode = "GRANT" | "SET" | "REAPPLY_DEFAULT";

export type LeaveStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "TEAM_LEADER_APPROVED"
  | "OPERATION_MANAGER_APPROVED"
  | "HR_APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type LeaveApprovalStage = "TEAM_LEADER" | "OPERATION_MANAGER" | "HR" | "HEAD_HR" | "ADMIN";

export type HalfDayPeriod = "FIRST_HALF" | "SECOND_HALF";

export type LeaveRequestApproval = {
  id: number;
  stage: LeaveApprovalStage;
  approver: { id: number; name: string };
  decision: "APPROVED" | "REJECTED";
  reason: string | null;
  decided_at: string;
};

export type LeaveRequest = {
  id: number;
  employee: { id: number; full_name: string; employee_code: string };
  leave_type: { id: number; name: string; code: string };
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  half_day_period: HalfDayPeriod | null;
  days_requested: number;
  reason: string | null;
  status: LeaveStatus;
  current_stage: LeaveApprovalStage | null;
  required_stages: LeaveApprovalStage[];
  is_direct_approval: boolean;
  direct_approval_reason: string | null;
  bypassed_stages: LeaveApprovalStage[] | null;
  submitted_at: string | null;
  decided_at: string | null;
  rejection_reason: string | null;
  cancelled_at: string | null;
  approvals: LeaveRequestApproval[];
};
