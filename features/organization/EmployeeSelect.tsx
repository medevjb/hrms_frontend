"use client";

import { useId } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployees } from "@/services/employees";

/**
 * Picks one employee (e.g. as an Operation Manager or Team Leader). Backed
 * by the first page of /employees — fine for V1's "simple first" scale;
 * revisit with a real search-as-you-type endpoint if the roster outgrows it.
 */
export function EmployeeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const { data, isLoading } = useEmployees({});
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
          <SelectValue placeholder="Select an employee" />
        </SelectTrigger>
        <SelectContent>
          {(data?.data ?? []).map((employee) => (
            <SelectItem key={employee.id} value={String(employee.id)}>
              {employee.full_name} ({employee.employee_code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
