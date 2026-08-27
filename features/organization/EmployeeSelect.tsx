"use client";

import { Select } from "@mantine/core";
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
  clearable = true,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  clearable?: boolean;
}) {
  const { data, isLoading } = useEmployees({});

  return (
    <Select
      label={label}
      placeholder="Select an employee"
      data={(data?.data ?? []).map((employee) => ({
        value: String(employee.id),
        label: `${employee.full_name} (${employee.employee_code})`,
      }))}
      value={value}
      onChange={onChange}
      disabled={isLoading}
      searchable
      clearable={clearable}
    />
  );
}
