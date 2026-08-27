// Mirrors backend/app/Http/Resources/Api/V1/{Shift,ShiftOverride}Resource.php.

export type Shift = {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  expected_work_minutes: number;
  break_minutes: number;
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
