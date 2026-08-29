// Mirrors backend/app/Http/Resources/Api/V1/Overtime*.php and
// App\Enums\Overtime*.php (docs/PRD.md §42-§53, §67, §90).

export type OvertimeType = "WEEKEND" | "HOLIDAY";

export type OvertimeStatus =
  | "DETECTED"
  | "PENDING_TEAM_LEADER"
  | "PENDING_OPERATION_MANAGER"
  | "PENDING_HR"
  | "APPROVED"
  | "REJECTED"
  | "PAYROLL_PROCESSED";

export type OvertimeApprovalStage = "TEAM_LEADER" | "OPERATION_MANAGER" | "HR";

export type OvertimeApproval = {
  id: number;
  stage: OvertimeApprovalStage;
  approver: { id: number; name: string };
  decision: "APPROVED" | "REJECTED";
  reason: string | null;
  decided_at: string;
};

export type OvertimeRecord = {
  id: number;
  employee: { id: number; full_name: string; employee_code: string };
  attendance_record_id: number;
  work_date: string;
  type: OvertimeType;
  worked_minutes: number;
  full_day_minutes_used: number;
  overtime_days: number;
  manual_days_override: number | null;
  effective_overtime_days: number;
  status: OvertimeStatus;
  current_stage: OvertimeApprovalStage | null;
  rejection_reason: string | null;
  manual_adjustment_reason: string | null;
  adjusted_at: string | null;
  decided_at: string | null;
  payroll_processed_at: string | null;
  approvals: OvertimeApproval[];
};
