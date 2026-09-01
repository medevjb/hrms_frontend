import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { PaginationMeta } from "@/types/api";
import type {
  BulkLeaveBalanceMode,
  HalfDayPeriod,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
} from "@/types/leave";

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types"],
    queryFn: () => browserFetch<LeaveType[]>("/leave-types"),
  });
}

export type SaveLeaveTypeInput = {
  name: string;
  code: string;
  annual_allocation_days: number;
  is_paid?: boolean;
  supports_half_day?: boolean;
  carry_forward_enabled?: boolean;
  carry_forward_cap_days?: number | null;
  requires_document?: boolean;
  max_consecutive_days?: number | null;
  min_employment_days?: number | null;
  accrual_mode?: "UPFRONT" | "MONTHLY";
  is_active?: boolean;
};

export function useCreateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveLeaveTypeInput) =>
      browserFetch<LeaveType>("/leave-types", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave-types"] }),
  });
}

export function useUpdateLeaveType(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<SaveLeaveTypeInput>) =>
      browserFetch<LeaveType>(`/leave-types/${id}`, { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave-types"] }),
  });
}

export function useDeactivateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => browserFetch<void>(`/leave-types/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave-types"] }),
  });
}

export function useLeaveBalances(employeeId?: number) {
  return useQuery({
    queryKey: ["leave-balances", employeeId ?? "self"],
    queryFn: () =>
      browserFetch<LeaveBalance[]>(
        `/leave-balances${employeeId ? `?filter[employee_id]=${employeeId}` : ""}`,
      ),
  });
}

export function useAdjustLeaveBalance(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { amount: number; note: string }) =>
      browserFetch<LeaveBalance>(`/leave-balances/${id}/adjust`, { method: "PATCH", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave-balances"] }),
  });
}

export type BulkAdjustLeaveBalanceInput = {
  leave_type_id: number;
  mode: BulkLeaveBalanceMode;
  amount?: number;
  note: string;
};

/**
 * Org-wide balance operation — grant/set/reset one leave type for every
 * active employee at once. Backend gates this on leave.policy.manage
 * (Admin / Head of HR only).
 */
export function useBulkAdjustLeaveBalances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkAdjustLeaveBalanceInput) =>
      browserFetch<{ affected: number }>("/leave-balances/bulk-adjust", {
        method: "POST",
        body: input,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave-balances"] }),
  });
}

export type LeaveRequestFilters = {
  mine?: boolean;
  pending_my_approval?: boolean;
  status?: LeaveStatus;
  employee_id?: number;
  leave_type_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
};

type LeaveRequestListResult = { data: LeaveRequest[]; meta: PaginationMeta };

function buildQuery(filters: LeaveRequestFilters): string {
  const params = new URLSearchParams();
  if (filters.mine) params.set("filter[mine]", "1");
  if (filters.pending_my_approval) params.set("filter[pending_my_approval]", "1");
  if (filters.status) params.set("filter[status]", filters.status);
  if (filters.employee_id) params.set("filter[employee_id]", String(filters.employee_id));
  if (filters.leave_type_id) params.set("filter[leave_type_id]", String(filters.leave_type_id));
  if (filters.date_from) params.set("filter[date_from]", filters.date_from);
  if (filters.date_to) params.set("filter[date_to]", filters.date_to);
  if (filters.page) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useLeaveRequests(filters: LeaveRequestFilters = {}) {
  return useQuery({
    queryKey: ["leave-requests", filters],
    queryFn: async () => {
      // browserFetch unwraps `.data` and drops `.meta`; pagination needs
      // both, so this goes straight through the proxy like useAttendanceList.
      const response = await fetch(`/api/proxy/leave-requests${buildQuery(filters)}`);
      if (!response.ok) throw new Error("Failed to load leave requests");
      return (await response.json()) as LeaveRequestListResult;
    },
  });
}

export function useLeaveRequest(id: number | null) {
  return useQuery({
    queryKey: ["leave-requests", "detail", id],
    queryFn: () => browserFetch<LeaveRequest>(`/leave-requests/${id}`),
    enabled: id !== null,
  });
}

export type SubmitLeaveRequestInput = {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  is_half_day?: boolean;
  half_day_period?: HalfDayPeriod;
  reason?: string | null;
};

export function useSubmitLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitLeaveRequestInput) =>
      browserFetch<LeaveRequest>("/leave-requests", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

export function useApproveLeaveRequest(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: string) =>
      browserFetch<LeaveRequest>(`/leave-requests/${id}/approve`, { method: "POST", body: { reason } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

export function useRejectLeaveRequest(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason: string) =>
      browserFetch<LeaveRequest>(`/leave-requests/${id}/reject`, { method: "POST", body: { reason } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave-requests"] }),
  });
}

export function useDirectApproveLeaveRequest(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason: string) =>
      browserFetch<LeaveRequest>(`/leave-requests/${id}/direct-approve`, { method: "POST", body: { reason } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

export function useCancelLeaveRequest(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => browserFetch<LeaveRequest>(`/leave-requests/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}
