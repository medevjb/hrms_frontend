// Mirrors backend/app/Http/Resources/Api/V1/*SettingsResource.php — four
// differently-gated slices of the one OrganizationSettings singleton
// (docs/PRD.md §139.6).

export type OrganizationSettingsData = {
  company_name: string;
  company_logo_path: string | null;
  timezone: string;
  currency: string;
  currency_decimal_places: number;
  weekend_days: string[];
  default_shift_id: number | null;
};

export type MissingCheckoutPolicy = "LEAVE_OPEN" | "AUTO_CLOSE_AT_SHIFT_END";

export type AttendanceSettings = {
  late_grace_minutes: number;
  auto_absent_enabled: boolean;
  missing_checkout_policy: MissingCheckoutPolicy;
  attendance_min_minutes_half_day: number | null;
};

export type OvertimeDailySalaryBasis = "BASIC" | "GROSS";
export type OvertimeHourlyRateMode = "FIXED" | "SALARY_DERIVED";

export type OvertimeSettings = {
  overtime_enabled: boolean;
  weekend_overtime_enabled: boolean;
  holiday_overtime_enabled: boolean;
  hourly_overtime_enabled: boolean;
  overtime_full_day_minutes: number;
  overtime_daily_salary_basis: OvertimeDailySalaryBasis;
  overtime_hourly_rate_mode: OvertimeHourlyRateMode;
  overtime_hourly_fixed_rate: string | null;
  overtime_hourly_multiplier: string;
};

export type SalaryDayCalculationMethod = "FIXED_30_DAYS" | "CALENDAR_DAYS" | "WORKING_DAYS";

export type PayrollSettings = {
  payroll_cutoff_day: number | null;
  salary_day_calculation_method: SalaryDayCalculationMethod;
  late_penalty_enabled: boolean;
  absence_deduction_enabled: boolean;
  unpaid_leave_deduction_enabled: boolean;
  overtime_earnings_enabled: boolean;
  dispute_window_days: number;
};

export type LatePenaltyOutcome = "WARNING" | "DEDUCTION";
export type LatePenaltyDeductionMode = "DAY_FRACTION" | "FIXED_AMOUNT";

export type LatePenaltyRule = {
  id: number;
  effective_from: string;
  late_days_threshold: number;
  outcome: LatePenaltyOutcome;
  deduction_mode: LatePenaltyDeductionMode | null;
  deduction_value: string | null;
};

export type LeaveSettings = {
  leave_year_start_month: number;
  leave_carry_forward_cap_days: number | null;
};

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
