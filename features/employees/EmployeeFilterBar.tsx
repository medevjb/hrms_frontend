"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDownIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  FilterIcon,
  RotateCcwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  UserCheckIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

const STATUS_OPTIONS: { value: EmployeeStatus; label: string; dot: string }[] = [
  { value: "INVITED", label: "Invited", dot: "bg-blue-500" },
  { value: "ACTIVE", label: "Active", dot: "bg-emerald-500" },
  { value: "PROBATION", label: "Probation", dot: "bg-amber-500" },
  { value: "NOTICE_PERIOD", label: "Notice Period", dot: "bg-rose-500" },
  { value: "SUSPENDED", label: "Suspended", dot: "bg-red-500" },
  { value: "RESIGNED", label: "Resigned", dot: "bg-slate-400" },
  { value: "TERMINATED", label: "Terminated", dot: "bg-red-600" },
  { value: "ARCHIVED", label: "Archived", dot: "bg-slate-400" },
];

const QUICK_STATUS_PILLS: { value: EmployeeStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "PROBATION", label: "Probation" },
  { value: "NOTICE_PERIOD", label: "Notice Period" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "TERMINATED", label: "Terminated" },
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const departments = useDepartments();
  const teams = useTeams(filters.department_id ? Number(filters.department_id) : undefined);

  const set = <K extends keyof EmployeeUiFilters>(key: K, value: EmployeeUiFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const advancedCount = advancedFilterCount(filters);
  const active = isEmployeeFilterActive(filters);

  const activeDepartmentName = useMemo(() => {
    if (!filters.department_id) return null;
    return departments.data?.find((d) => String(d.id) === filters.department_id)?.name;
  }, [filters.department_id, departments.data]);

  const activeTeamName = useMemo(() => {
    if (!filters.team_id) return null;
    return teams.data?.find((t) => String(t.id) === filters.team_id)?.name;
  }, [filters.team_id, teams.data]);

  function resetAdvanced() {
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
    });
  }

  return (
    <div className="space-y-3 mb-5">
      {/* QUICK STATUS PILLS BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {QUICK_STATUS_PILLS.map((pill) => {
          const isSelected = filters.status === pill.value;
          const statusConfig = STATUS_OPTIONS.find((s) => s.value === pill.value);

          return (
            <button
              key={pill.value}
              type="button"
              onClick={() => set("status", pill.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border shrink-0 ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                  : "bg-card hover:bg-muted text-muted-foreground border-border/70 hover:text-foreground"
              }`}
            >
              {statusConfig && (
                <span
                  className={`size-2 rounded-full ${
                    isSelected ? "bg-primary-foreground" : statusConfig.dot
                  }`}
                />
              )}
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN SEARCH & FILTER CONTROLS BAR */}
      <div className="bg-card p-3.5 rounded-2xl border border-border/70 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search name, employee code, email, role..."
              value={filters.search}
              onChange={(event) => set("search", event.target.value)}
              className="pl-10 pr-9 text-sm h-10 bg-background/50 rounded-xl"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => set("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>

          {/* Controls Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Select */}
            <Select
              value={filters.status}
              onValueChange={(value) => set("status", value as EmployeeStatus | "all")}
            >
              <SelectTrigger className="w-[160px] text-xs h-10 rounded-xl bg-background/50">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-slate-400" />
                    <span>All Statuses</span>
                  </div>
                </SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${option.dot}`} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* VERTICAL SLIDE-OVER ADVANCED FILTER DRAWER (SHEET) */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-10 text-xs gap-2 rounded-xl bg-background/50 ${
                    advancedCount > 0
                      ? "border-primary text-primary font-semibold shadow-xs ring-1 ring-primary/20"
                      : ""
                  }`}
                >
                  <SlidersHorizontalIcon className="size-3.5" />
                  <span>Advanced Filters</span>
                  {advancedCount > 0 && (
                    <Badge className="ml-0.5 size-5 justify-center rounded-full p-0 text-[10px] font-bold">
                      {advancedCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
                {/* Drawer Header */}
                <SheetHeader className="p-5 border-b border-border bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <FilterIcon className="size-4" />
                      </div>
                      <div>
                        <SheetTitle className="text-base font-bold text-foreground">
                          Advanced Filters
                        </SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground">
                          Narrow down employee records by department, shift, or tenure.
                        </SheetDescription>
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                {/* Vertical Form Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* SECTION 1: ORGANIZATION & STRUCTURE */}
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground uppercase tracking-wider">
                      <Building2Icon className="size-3.5 text-primary" />
                      <span>Organization & Structure</span>
                    </div>

                    <div className="space-y-3.5">
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
                          <SelectTrigger className="w-full bg-background">
                            <SelectValue placeholder="Any department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Department</SelectItem>
                            {(departments.data ?? []).map((department) => (
                              <SelectItem key={department.id} value={String(department.id)}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField label="Team / Unit">
                        <Select
                          value={filters.team_id ?? "all"}
                          onValueChange={(value) => set("team_id", value === "all" ? null : value)}
                        >
                          <SelectTrigger className="w-full bg-background">
                            <SelectValue placeholder="Any team" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Team</SelectItem>
                            {(teams.data ?? []).map((team) => (
                              <SelectItem key={team.id} value={String(team.id)}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <EmployeeSelect
                        label="Reports To (Team Leader)"
                        value={filters.team_leader_id}
                        onChange={(value) => set("team_leader_id", value)}
                      />
                    </div>
                  </div>

                  {/* SECTION 2: WORK SCHEDULE & EMPLOYMENT */}
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground uppercase tracking-wider">
                      <BriefcaseIcon className="size-3.5 text-primary" />
                      <span>Employment & Schedule</span>
                    </div>

                    <div className="space-y-3.5">
                      <FormField label="Employment Type">
                        <Select
                          value={filters.employment_type}
                          onValueChange={(value) =>
                            set("employment_type", value as EmploymentType | "all")
                          }
                        >
                          <SelectTrigger className="w-full bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Employment Type</SelectItem>
                            {EMPLOYMENT_TYPES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <ShiftSelect
                        label="Regular Shift Schedule"
                        value={filters.shift_id}
                        onChange={(value) => set("shift_id", value)}
                      />

                      <FormField label="Overtime Eligibility">
                        <Select
                          value={filters.overtime_eligible}
                          onValueChange={(value) =>
                            set("overtime_eligible", value as EmployeeUiFilters["overtime_eligible"])
                          }
                        >
                          <SelectTrigger className="w-full bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Eligibility</SelectItem>
                            <SelectItem value="yes">Eligible for Overtime Only</SelectItem>
                            <SelectItem value="no">Not Eligible for Overtime</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                  </div>

                  {/* SECTION 3: TENURE & ATTRIBUTES */}
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground uppercase tracking-wider">
                      <CalendarIcon className="size-3.5 text-primary" />
                      <span>Tenure & Flags</span>
                    </div>

                    <div className="space-y-3.5">
                      <FormField label="Joined Date Range">
                        <div className="grid grid-cols-2 gap-2">
                          <DatePicker
                            value={filters.joined_from}
                            onChange={(value) => set("joined_from", value)}
                            placeholder="From Date"
                          />
                          <DatePicker
                            value={filters.joined_to}
                            onChange={(value) => set("joined_to", value)}
                            placeholder="To Date"
                          />
                        </div>
                      </FormField>

                      <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background cursor-pointer">
                        <Checkbox
                          checked={filters.unassigned}
                          onCheckedChange={(checked) => set("unassigned", checked === true)}
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-foreground">Unassigned Only</span>
                          <p className="text-[11px] text-muted-foreground">Employees with no team assignment</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Sticky Drawer Footer */}
                <SheetFooter className="p-4 border-t border-border bg-card flex-row items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={advancedCount === 0}
                    onClick={resetAdvanced}
                    className="gap-1.5 text-xs text-muted-foreground"
                  >
                    <RotateCcwIcon className="size-3.5" />
                    <span>Reset Advanced</span>
                  </Button>

                  <Button type="button" size="sm" onClick={() => setSheetOpen(false)}>
                    Apply Filters
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Sort Order Dropdown */}
            <Select value={filters.sort} onValueChange={(value) => set("sort", value as EmployeeSort)}>
              <SelectTrigger className="w-[160px] text-xs h-10 rounded-xl bg-background/50">
                <div className="flex items-center gap-2 truncate">
                  <ArrowUpDownIcon className="size-3.5 text-muted-foreground shrink-0" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ACTIVE FILTERS SUMMARY BAR */}
        {active && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-medium">Active Filters:</span>

              {filters.search && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                  Search: &quot;{filters.search}&quot;
                  <XIcon className="size-3 cursor-pointer" onClick={() => set("search", "")} />
                </Badge>
              )}

              {filters.status !== "all" && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                  Status: {STATUS_OPTIONS.find((s) => s.value === filters.status)?.label ?? filters.status}
                  <XIcon className="size-3 cursor-pointer" onClick={() => set("status", "all")} />
                </Badge>
              )}

              {filters.employment_type !== "all" && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                  Type: {EMPLOYMENT_TYPES.find((e) => e.value === filters.employment_type)?.label ?? filters.employment_type}
                  <XIcon className="size-3 cursor-pointer" onClick={() => set("employment_type", "all")} />
                </Badge>
              )}

              {activeDepartmentName && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                  Department: {activeDepartmentName}
                  <XIcon className="size-3 cursor-pointer" onClick={() => set("department_id", null)} />
                </Badge>
              )}

              {activeTeamName && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                  Team: {activeTeamName}
                  <XIcon className="size-3 cursor-pointer" onClick={() => set("team_id", null)} />
                </Badge>
              )}

              {filters.unassigned && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                  No Team
                  <XIcon className="size-3 cursor-pointer" onClick={() => set("unassigned", false)} />
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(EMPTY_EMPLOYEE_FILTERS)}
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcwIcon className="size-3" />
              <span>Clear All</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


