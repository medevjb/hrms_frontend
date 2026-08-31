// Mirrors backend/app/Http/Resources/Api/V1/{Shift,ShiftOverride}Resource.php.

export type Shift = {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  expected_work_minutes: number;
  break_minutes: number;
  // Optional scheduled break window ("13:00"), null when the shift has no
  // fixed break time. break_minutes tracks the window when one is set.
  break_start: string | null;
  break_end: string | null;
  late_grace_minutes: number | null;
  is_overnight: boolean;
  active: boolean;
};

export type ShiftOverride = {
  id: number;
  employee_id: number;
  work_date: string;
  reason: string;
  changed_by: number | null;
  shift: Shift;
};
