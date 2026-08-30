// Mirrors backend/app/Enums/ReportType.php and App\Support\Report (docs/PRD.md §99).

export type ReportType =
  | "employee_directory"
  | "attendance"
  | "late_attendance"
  | "absence"
  | "leave"
  | "leave_balance"
  | "overtime"
  | "payroll"
  | "payroll_deductions";

export type ReportTypeInfo = {
  type: ReportType;
  title: string;
  uses_payroll_period: boolean;
};

export type ReportColumn = { key: string; label: string };

export type ReportResult = {
  type: ReportType;
  title: string;
  columns: ReportColumn[];
  rows: Record<string, string | number | null>[];
  total: number;
  truncated: boolean;
};

export type ReportFilters = {
  date_from?: string | null;
  date_to?: string | null;
  department_id?: number | null;
  team_id?: number | null;
  employee_id?: number | null;
  payroll_period_id?: number | null;
};
