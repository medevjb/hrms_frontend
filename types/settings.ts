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
