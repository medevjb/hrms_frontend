import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { PaginationMeta } from "@/types/api";
import type {
  EmployeeSalary,
  PayrollAdjustmentType,
  PayrollEntry,
  PayrollPeriod,
  SalaryComponent,
} from "@/types/payroll";

export function useSalaryComponents() {
  return useQuery({
    queryKey: ["salary-components"],
    queryFn: () => browserFetch<SalaryComponent[]>("/salary-components"),
  });
}

export function useEmployeeSalary(employeeId: number) {
  return useQuery({
    queryKey: ["employee-salary", employeeId],
    queryFn: () =>
      browserFetch<{ current: EmployeeSalary | null; history: EmployeeSalary[] }>(
        `/employees/${employeeId}/salary`,
      ),
    enabled: Number.isFinite(employeeId),
  });
}

export type AssignSalaryInput = {
  effective_from: string;
  note?: string | null;
  components: { salary_component_id: number; amount: string }[];
};

export function useAssignSalary(employeeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignSalaryInput) =>
      browserFetch<EmployeeSalary>(`/employees/${employeeId}/salary`, { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-salary", employeeId] }),
  });
}

export function usePayrollPeriods() {
  return useQuery({
    queryKey: ["payroll-periods"],
    queryFn: () => browserFetch<PayrollPeriod[]>("/payroll/periods"),
  });
}

export function usePayrollPeriod(id: number) {
  return useQuery({
    queryKey: ["payroll-periods", id],
    queryFn: () => browserFetch<PayrollPeriod>(`/payroll/periods/${id}`),
    enabled: Number.isFinite(id),
  });
}

export function useCreatePayrollPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { year: number; month: number }) =>
      browserFetch<PayrollPeriod>("/payroll/periods", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll-periods"] }),
  });
}

export function useGeneratePayroll(periodId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      browserFetch<PayrollPeriod>(`/payroll/periods/${periodId}/generate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-entries"] });
    },
  });
}

export type PayrollEntryFilters = { payroll_period_id?: number; mine?: boolean; page?: number };

type PayrollEntryListResult = { data: PayrollEntry[]; meta: PaginationMeta };

export function usePayrollEntries(filters: PayrollEntryFilters = {}) {
  return useQuery({
    queryKey: ["payroll-entries", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.payroll_period_id) params.set("filter[payroll_period_id]", String(filters.payroll_period_id));
      if (filters.mine) params.set("filter[mine]", "1");
      if (filters.page) params.set("page", String(filters.page));
      const query = params.toString();
      const response = await fetch(`/api/proxy/payroll/entries${query ? `?${query}` : ""}`);
      if (!response.ok) throw new Error("Failed to load payroll entries");
      return (await response.json()) as PayrollEntryListResult;
    },
  });
}

export function usePayrollEntry(id: number | null) {
  return useQuery({
    queryKey: ["payroll-entries", "detail", id],
    queryFn: () => browserFetch<PayrollEntry>(`/payroll/entries/${id}`),
    enabled: id !== null,
  });
}

export type AdjustPayrollEntryInput = {
  type: PayrollAdjustmentType;
  label: string;
  amount: string;
  reason: string;
};

export function useAdjustPayrollEntry(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdjustPayrollEntryInput) =>
      browserFetch<PayrollEntry>(`/payroll/entries/${id}/adjust`, { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-entries"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
    },
  });
}
