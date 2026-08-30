// Mirrors backend/app/Http/Resources/Api/V1/Payroll*.php and
// App\Enums\Payroll*.php / SalaryComponentType (docs/PRD.md §59-§72).
//
// Money is always a string (docs/PRD.md §141) — format for display, never
// parse it to a number for arithmetic.

import type { SalaryDayCalculationMethod } from "./settings";

export type SalaryComponentType = "BASIC" | "ALLOWANCE";

export type SalaryComponent = {
  id: number;
  code: string;
  name: string;
  type: SalaryComponentType;
  sort_order: number;
  is_active: boolean;
};

export type EmployeeSalary = {
  id: number;
  effective_from: string;
  ended_at: string | null;
  is_current: boolean;
  basic_salary: string;
  gross_monthly: string;
  note: string | null;
  components: {
    salary_component_id: number;
    code: string;
    name: string;
    type: SalaryComponentType;
    amount: string;
  }[];
  created_at: string | null;
};

export type PayrollPeriodStatus =
  | "UPCOMING"
  | "OPEN"
  | "PROCESSING"
  | "REVIEW"
  | "EMPLOYEE_CONFIRMATION"
  | "FINALIZED"
  | "PAID"
  | "LOCKED";

export type PayrollPeriod = {
  id: number;
  label: string;
  start_date: string;
  end_date: string;
  status: PayrollPeriodStatus;
  cutoff_day_used: number | null;
  salary_day_calculation_method_used: SalaryDayCalculationMethod;
  processed_at: string | null;
  finalized_at: string | null;
  entry_count?: number;
  net_total?: string;
  created_at: string | null;
};

export type PayrollEntryStatus = "DRAFT" | "CALCULATED" | "PREPARED" | "RELEASED" | "FINALIZED";
export type PayrollLineCategory = "EARNING" | "DEDUCTION";
export type PayrollLineType =
  | "BASIC"
  | "ALLOWANCE"
  | "OVERTIME"
  | "BONUS"
  | "MANUAL_EARNING"
  | "LATE_PENALTY"
  | "ABSENCE"
  | "UNPAID_LEAVE"
  | "MANUAL_DEDUCTION";

export type PayrollAdjustmentType =
  | "ADD_EARNING"
  | "ADD_DEDUCTION"
  | "BONUS"
  | "WAIVE_PENALTY"
  | "OVERTIME_ADJUSTMENT";

export type PayrollEntryLine = {
  id: number;
  category: PayrollLineCategory;
  type: PayrollLineType;
  label: string;
  amount: string;
  is_manual: boolean;
  computed_from: Record<string, unknown> | null;
};

export type PayrollEntry = {
  id: number;
  payroll_period_id: number;
  status: PayrollEntryStatus;
  employee: { id: number; full_name: string; employee_code: string };
  period?: {
    id: number;
    label: string;
    status: PayrollPeriodStatus;
    start_date: string;
    end_date: string;
  };
  basic_salary: string;
  daily_salary: string;
  period_days: number;
  late_days: string;
  absent_days: string;
  unpaid_leave_days: string;
  overtime_days: string;
  gross_earnings: string;
  total_deductions: string;
  net_salary: string;
  calculated_at: string | null;
  lines?: PayrollEntryLine[];
  adjustments?: {
    id: number;
    type: PayrollAdjustmentType;
    label: string;
    amount: string;
    reason: string;
    created_at: string | null;
  }[];
};
