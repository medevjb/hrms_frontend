import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { PaginationMeta } from "@/types/api";
import type { OvertimeRecord, OvertimeStatus, OvertimeType } from "@/types/overtime";

export type OvertimeFilters = {
  mine?: boolean;
  pending_my_approval?: boolean;
  status?: OvertimeStatus;
  type?: OvertimeType;
  employee_id?: number;
  page?: number;
};

type OvertimeListResult = { data: OvertimeRecord[]; meta: PaginationMeta };

function buildQuery(filters: OvertimeFilters): string {
  const params = new URLSearchParams();
  if (filters.mine) params.set("filter[mine]", "1");
  if (filters.pending_my_approval) params.set("filter[pending_my_approval]", "1");
  if (filters.status) params.set("filter[status]", filters.status);
  if (filters.type) params.set("filter[type]", filters.type);
  if (filters.employee_id) params.set("filter[employee_id]", String(filters.employee_id));
  if (filters.page) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useOvertimeRecords(filters: OvertimeFilters = {}) {
  return useQuery({
    queryKey: ["overtime", filters],
    queryFn: async () => {
      // browserFetch drops `.meta`; the list needs pagination, so it goes
      // straight through the proxy like useLeaveRequests.
      const response = await fetch(`/api/proxy/overtime${buildQuery(filters)}`);
      if (!response.ok) throw new Error("Failed to load overtime records");
      return (await response.json()) as OvertimeListResult;
    },
  });
}

export function useApproveOvertime(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: string) =>
      browserFetch<OvertimeRecord>(`/overtime/${id}/approve`, { method: "POST", body: { reason } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["overtime"] }),
  });
}

export function useRejectOvertime(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason: string) =>
      browserFetch<OvertimeRecord>(`/overtime/${id}/reject`, { method: "POST", body: { reason } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["overtime"] }),
  });
}

export type AdjustOvertimeInput = { overtime_days: number; reason: string };

export function useAdjustOvertime(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdjustOvertimeInput) =>
      browserFetch<OvertimeRecord>(`/overtime/${id}/adjust`, { method: "PATCH", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["overtime"] }),
  });
}
