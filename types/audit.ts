// Mirrors backend/app/Enums/AuditAction.php and AuditLogResource.php (docs/PRD.md §83).

export type AuditLog = {
  id: number;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
  user: { id: number; name: string } | null;
  created_at: string;
};

export const AUDIT_ACTIONS = [
  "ATTENDANCE_UPDATED",
  "ATTENDANCE_GRACE_CHANGED",
  "SHIFT_CHANGED",
  "LEAVE_APPROVED",
  "LEAVE_REJECTED",
  "OVERTIME_APPROVED",
  "OVERTIME_ADJUSTED",
  "SALARY_CHANGED",
  "PAYROLL_ADJUSTED",
  "PAYROLL_FINALIZED",
  "PAYROLL_SETTINGS_CHANGED",
  "EMPLOYEE_STATUS_CHANGED",
  "LEAVE_BALANCE_ADJUSTED",
  "PAYROLL_DISPUTE_RAISED",
  "PAYROLL_DISPUTE_RESOLVED",
  "PAYROLL_ARREAR_CREATED",
  "PAYROLL_ARREAR_APPLIED",
  "ROLE_ASSIGNED",
  "REPORT_EXPORTED",
  "DOCUMENT_DOWNLOADED",
  "HOLIDAY_NOTICE_APPROVED",
] as const;
