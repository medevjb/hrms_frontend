// Mirrors backend/app/Http/Resources/Api/V1/{AttendanceRecord,AttendanceToday}Resource.php
// and App\Enums\AttendanceStatus.

export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "ON_LEAVE"
  | "HOLIDAY"
  | "WEEKEND"
  | "HALF_DAY"
  | "MISSING_CHECKOUT";

export type AttendanceRecord = {
  id: number;
  employee: { id: number; full_name: string; employee_code: string };
  work_date: string;
  shift: { id: number; name: string } | null;
  shift_start_used: string | null;
  shift_end_used: string | null;
  grace_minutes_used: number | null;
  grace_end_time: string | null;
  check_in: string | null;
  check_out: string | null;
  worked_minutes: number | null;
  late_minutes: number | null;
  status: AttendanceStatus;
  is_manual_adjustment: boolean;
};

export type AttendanceToday = {
  work_date: string;
  is_work_day: boolean;
  is_weekend: boolean;
  is_holiday: boolean;
  has_approved_leave: boolean;
  shift: { id: number; name: string } | null;
  shift_start: string | null;
  shift_end: string | null;
  // Wall-clock "HH:MM" from the shift's scheduled break, null when unset.
  break_start: string | null;
  break_end: string | null;
  grace_end: string | null;
  should_prompt_check_in: boolean;
  record: AttendanceRecord | null;
};
