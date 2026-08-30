"use client";

import { useId } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useShifts } from "@/services/shifts";

export function ShiftSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const { data, isLoading } = useShifts();
  const id = useId();

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}
      <Select value={value ?? undefined} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select a shift" />
        </SelectTrigger>
        <SelectContent>
          {(data ?? [])
            .filter((shift) => shift.active)
            .map((shift) => (
              <SelectItem key={shift.id} value={String(shift.id)}>
                {shift.name} ({shift.start_time}–{shift.end_time})
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
