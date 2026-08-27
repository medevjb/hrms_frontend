import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { PaginationMeta } from "@/types/api";
import type { Employee, EmployeeStatus, EmploymentType } from "@/types/organization";

type EmployeeFilters = {
  status?: EmployeeStatus;
  team_id?: number;
  department_id?: number;
  page?: number;
};

type EmployeeListResult = { data: Employee[]; meta: PaginationMeta };

function buildQuery(filters: EmployeeFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("filter[status]", filters.status);
  if (filters.team_id) params.set("filter[team_id]", String(filters.team_id));
  if (filters.department_id) params.set("filter[department_id]", String(filters.department_id));
  if (filters.page) params.set("page", String(filters.page));
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
