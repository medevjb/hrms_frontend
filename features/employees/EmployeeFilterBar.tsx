"use client";

import { useState } from "react";
import { SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeSelect } from "@/features/organization/EmployeeSelect";
import { ShiftSelect } from "@/features/shifts/ShiftSelect";
import { useDepartments } from "@/services/departments";
import type { EmployeeFilters, EmployeeSort } from "@/services/employees";
import { useTeams } from "@/services/teams";
import type { EmployeeStatus, EmploymentType } from "@/types/organization";

export type EmployeeUiFilters = {
  search: string;
  status: EmployeeStatus | "all";
  employment_type: EmploymentType | "all";
  department_id: string | null;
  team_id: string | null;
  team_leader_id: string | null;
  shift_id: string | null;
  overtime_eligible: "any" | "yes" | "no";
  unassigned: boolean;
  joined_from: string | null;
  joined_to: string | null;
  sort: EmployeeSort;
};

export const EMPTY_EMPLOYEE_FILTERS: EmployeeUiFilters = {
  search: "",
  status: "all",
  employment_type: "all",
  department_id: null,
  team_id: null,
  team_leader_id: null,
  shift_id: null,
  overtime_eligible: "any",
  unassigned: false,
  joined_from: null,
  joined_to: null,
  sort: "name",
};

const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "INVITED", label: "Invited" },
  { value: "ACTIVE", label: "Active" },
  { value: "PROBATION", label: "Probation" },
  { value: "NOTICE_PERIOD", label: "Notice period" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "ARCHIVED", label: "Archived" },
];

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
];

const SORT_OPTIONS: { value: EmployeeSort; label: string }[] = [
  { value: "name", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "joined_desc", label: "Newest hires" },
  { value: "joined", label: "Longest tenure" },
  { value: "code", label: "Employee code" },
];

/** Filters that live behind the "Filters" popover (everything except the
 *  always-visible search, status, and sort controls). */
export function advancedFilterCount(filters: EmployeeUiFilters): number {
  let count = 0;
  if (filters.employment_type !== "all") count += 1;
  if (filters.department_id) count += 1;
  if (filters.team_id) count += 1;
  if (filters.team_leader_id) count += 1;
  if (filters.shift_id) count += 1;
  if (filters.overtime_eligible !== "any") count += 1;
  if (filters.unassigned) count += 1;
  if (filters.joined_from || filters.joined_to) count += 1;
  return count;
}

export function isEmployeeFilterActive(filters: EmployeeUiFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.status !== "all" ||
    filters.sort !== "name" ||
    advancedFilterCount(filters) > 0
  );
}

export function toServiceFilters(filters: EmployeeUiFilters): EmployeeFilters {
  return {
    search: filters.search.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    employment_type: filters.employment_type === "all" ? undefined : filters.employment_type,
    department_id: filters.department_id ? Number(filters.department_id) : undefined,
    team_id: filters.team_id ? Number(filters.team_id) : undefined,
    team_leader_id: filters.team_leader_id ? Number(filters.team_leader_id) : undefined,
    shift_id: filters.shift_id ? Number(filters.shift_id) : undefined,
    overtime_eligible:
      filters.overtime_eligible === "any" ? undefined : filters.overtime_eligible === "yes",
    unassigned: filters.unassigned || undefined,
    joined_from: filters.joined_from ?? undefined,
    joined_to: filters.joined_to ?? undefined,
    sort: filters.sort === "name" ? undefined : filters.sort,
  };
}

export function EmployeeFilterBar({
  filters,
  onChange,
}: {
  filters: EmployeeUiFilters;
  onChange: (next: EmployeeUiFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const departments = useDepartments();
  const teams = useTeams(filters.department_id ? Number(filters.department_id) : undefined);

  const set = <K extends keyof EmployeeUiFilters>(key: K, value: EmployeeUiFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const advancedCount = advancedFilterCount(filters);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, code, email, role"
          value={filters.search}
          onChange={(event) => set("search", event.target.value)}
          className="pl-8"
        />
      </div>

      <Select
        value={filters.status}
        onValueChange={(value) => set("status", value as EmployeeStatus | "all")}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <SlidersHorizontalIcon className="size-4" />
            Filters
            {advancedCount > 0 && (
              <Badge className="ml-0.5 size-5 justify-center rounded-full p-0 tabular-nums">
                {advancedCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Filters</p>
            {advancedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() =>
                  onChange({
                    ...filters,
                    employment_type: "all",
                    department_id: null,
                    team_id: null,
                    team_leader_id: null,
                    shift_id: null,
                    overtime_eligible: "any",
                    unassigned: false,
                    joined_from: null,
                    joined_to: null,
                  })
                }
              >
                Reset
              </Button>
            )}
          </div>

          <FormField label="Department">
            <Select
              value={filters.department_id ?? "all"}
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  department_id: value === "all" ? null : value,
                  team_id: null,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any department</SelectItem>
                {(departments.data ?? []).map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Team">
            <Select
              value={filters.team_id ?? "all"}
              onValueChange={(value) => set("team_id", value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any team</SelectItem>
                {(teams.data ?? []).map((team) => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Employment type">
            <Select
              value={filters.employment_type}
              onValueChange={(value) =>
                set("employment_type", value as EmploymentType | "all")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any type</SelectItem>
                {EMPLOYMENT_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <ShiftSelect
            label="Shift"
            value={filters.shift_id}
            onChange={(value) => set("shift_id", value)}
          />

          <EmployeeSelect
            label="Reports to (team lead)"
            value={filters.team_leader_id}
            onChange={(value) => set("team_leader_id", value)}
          />

          <FormField label="Joined between">
            <div className="flex items-center gap-2">
              <DatePicker
                value={filters.joined_from}
                onChange={(value) => set("joined_from", value)}
                placeholder="From"
              />
              <DatePicker
                value={filters.joined_to}
                onChange={(value) => set("joined_to", value)}
                placeholder="To"
              />
            </div>
          </FormField>

          <FormField label="Overtime">
            <Select
              value={filters.overtime_eligible}
              onValueChange={(value) =>
                set("overtime_eligible", value as EmployeeUiFilters["overtime_eligible"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="yes">Eligible</SelectItem>
                <SelectItem value="no">Not eligible</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={filters.unassigned}
              onCheckedChange={(checked) => set("unassigned", checked === true)}
            />
            Only people with no team
          </label>
        </PopoverContent>
      </Popover>

      <Select value={filters.sort} onValueChange={(value) => set("sort", value as EmployeeSort)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isEmployeeFilterActive(filters) && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => onChange(EMPTY_EMPLOYEE_FILTERS)}
        >
          <XIcon className="size-3.5" />
          Clear all
        </Button>
      )}
    </div>
  );
}
