import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { PaginationMeta } from "@/types/api";
import type { Employee, EmployeeStatus, EmploymentType } from "@/types/organization";
import type { Weekday } from "@/types/settings";

export type EmployeeSort =
  | "name"
  | "name_desc"
  | "joined"
  | "joined_desc"
  | "code"
  | "code_desc";

export type EmployeeFilters = {
  search?: string;
  status?: EmployeeStatus;
  employment_type?: EmploymentType;
  team_id?: number;
  department_id?: number;
  team_leader_id?: number;
  operation_manager_id?: number;
  shift_id?: number;
  overtime_eligible?: boolean;
  // A Weekday, or "default" for everyone still on the org default.
  weekend_day?: Weekday | "default";
  unassigned?: boolean;
  joined_from?: string;
  joined_to?: string;
  sort?: EmployeeSort;
  page?: number;
  per_page?: number;
};

type EmployeeListResult = { data: Employee[]; meta: PaginationMeta };

function buildQuery(filters: EmployeeFilters): string {
  const params = new URLSearchParams();
  const setFilter = (key: string, value: string | number | boolean | undefined) => {
    if (value === undefined || value === "") return;
    params.set(`filter[${key}]`, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  };

  setFilter("search", filters.search);
  setFilter("status", filters.status);
  setFilter("employment_type", filters.employment_type);
  setFilter("team_id", filters.team_id);
  setFilter("department_id", filters.department_id);
  setFilter("team_leader_id", filters.team_leader_id);
  setFilter("operation_manager_id", filters.operation_manager_id);
  setFilter("shift_id", filters.shift_id);
  setFilter("weekend_day", filters.weekend_day);
  setFilter("unassigned", filters.unassigned || undefined);
  setFilter("joined_from", filters.joined_from);
  setFilter("joined_to", filters.joined_to);
  if (filters.overtime_eligible !== undefined) {
    params.set("filter[overtime_eligible]", filters.overtime_eligible ? "1" : "0");
  }
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.per_page) params.set("per_page", String(filters.per_page));

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: ["employees", filters],
    queryFn: async () => {
      // browserFetch unwraps `data`; meta lives alongside it, so this one
      // call bypasses that unwrap to keep both.
      const response = await fetch(`/api/proxy/employees${buildQuery(filters)}`);
      if (!response.ok) throw new Error("Failed to load employees");
      return (await response.json()) as EmployeeListResult;
    },
  });
}

export function useEmployee(id: number) {
  return useQuery({
    queryKey: ["employees", id],
    queryFn: () => browserFetch<Employee>(`/employees/${id}`),
    enabled: Number.isFinite(id),
  });
}

export type CreateEmployeeInput = {
  email: string;
  first_name: string;
  last_name: string;
  joining_date: string;
  designation: string;
  employment_type: EmploymentType;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  confirmation_date?: string;
  office_location?: string;
  timezone?: string;
  weekend_day?: Weekday | null;
  overtime_eligible?: boolean;
};

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEmployeeInput) =>
      browserFetch<Employee>("/employees", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployee(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<CreateEmployeeInput>) =>
      browserFetch<Employee>(`/employees/${id}`, { method: "PUT", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

/**
 * Bulk-assign a weekly off day across a selection of employees. A null
 * weekend_day puts them back on the organization default. Ids outside the
 * caller's scope are silently skipped by the API.
 */
export function useAssignWeeklyOff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { employee_ids: number[]; weekend_day: Weekday | null }) =>
      browserFetch<{ updated: number[] }>("/employees/weekly-offs", {
        method: "PATCH",
        body: input,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useUpdateEmployeeStatus(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { status: EmployeeStatus; reason: string }) =>
      browserFetch<Employee>(`/employees/${id}/status`, { method: "PATCH", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

/**
 * Status change keyed by id in the payload rather than the hook — lets one
 * mutation instance drive a bulk change over a list of selected rows.
 */
export function useChangeEmployeeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; status: EmployeeStatus; reason: string }) =>
      browserFetch<Employee>(`/employees/${id}/status`, { method: "PATCH", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useTransferEmployee(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { team_id: number; effective_date?: string }) =>
      browserFetch<Employee>(`/employees/${id}/transfer`, { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useAssignShift(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { shift_id: number; effective_date?: string }) =>
      browserFetch<Employee>(`/employees/${id}/assign-shift`, { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => browserFetch<void>(`/employees/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

/** Re-sends the invitation email with a fresh link for an employee who
 *  hasn't accepted yet (the original expires after 72h and is single-use). */
export function useResendInvitation() {
  return useMutation({
    mutationFn: (id: number) =>
      browserFetch<void>(`/employees/${id}/resend-invitation`, { method: "POST" }),
  });
}
