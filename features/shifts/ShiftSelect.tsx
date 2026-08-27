"use client";

import { Select } from "@mantine/core";
import { useShifts } from "@/services/shifts";

export function ShiftSelect({
  label,
  value,
  onChange,
  clearable = true,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  clearable?: boolean;
}) {
  const { data, isLoading } = useShifts();

  return (
    <Select
      label={label}
      placeholder="Select a shift"
      data={(data ?? [])
        .filter((shift) => shift.active)
        .map((shift) => ({
          value: String(shift.id),
          label: `${shift.name} (${shift.start_time}–${shift.end_time})`,
        }))}
      value={value}
      onChange={onChange}
      disabled={isLoading}
      searchable
      clearable={clearable}
    />
  );
}
