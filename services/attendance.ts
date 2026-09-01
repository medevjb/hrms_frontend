import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { PaginationMeta } from "@/types/api";
import type { AttendanceRecord, AttendanceStatus, AttendanceToday } from "@/types/attendance";

export function useAttendanceToday() {
  return useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => browserFetch<AttendanceToday>("/attendance/today"),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => browserFetch<AttendanceRecord>("/attendance/check-in", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => browserFetch<AttendanceRecord>("/attendance/check-out", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export type AttendanceFilters = {
  employee_id?: number;
  date?: string;
  date_from?: string;
  date_to?: string;
  department_id?: number;
  team_id?: number;
  team_leader_id?: number;
  operation_manager_id?: number;
  shift_id?: number;
  status?: AttendanceStatus;
  page?: number;
};

type AttendanceListResult = { data: AttendanceRecord[]; meta: PaginationMeta };

function buildQuery(filters: AttendanceFilters): string {
  const params = new URLSearchParams();
  if (filters.employee_id) params.set("filter[employee_id]", String(filters.employee_id));
  if (filters.date) params.set("filter[date]", filters.date);
  if (filters.date_from) params.set("filter[date_from]", filters.date_from);
  if (filters.date_to) params.set("filter[date_to]", filters.date_to);
  if (filters.department_id) params.set("filter[department_id]", String(filters.department_id));
  if (filters.team_id) params.set("filter[team_id]", String(filters.team_id));
  if (filters.team_leader_id) params.set("filter[team_leader_id]", String(filters.team_leader_id));
  if (filters.operation_manager_id) {
    params.set("filter[operation_manager_id]", String(filters.operation_manager_id));
  }
  if (filters.shift_id) params.set("filter[shift_id]", String(filters.shift_id));
  if (filters.status) params.set("filter[status]", filters.status);
  if (filters.page) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useAttendanceList(filters: AttendanceFilters = {}) {
  return useQuery({
    queryKey: ["attendance", "list", filters],
    queryFn: async () => {
      const response = await fetch(`/api/proxy/attendance${buildQuery(filters)}`);
      if (!response.ok) throw new Error("Failed to load attendance");
      return (await response.json()) as AttendanceListResult;
    },
  });
}

/**
 * One employee's attendance records for a single month — the calendar
 * view on the dashboard and the Attendance page. `per_page` is lifted
 * well past a month's worth of rows so the calendar never renders a
 * partial month. `enabled` gates the call until an employee id is known.
 * The backend scopes the employee_id filter, so a manager only gets a
 * month back for someone in their visibility.
 */
export function useAttendanceMonth(
  employeeId: number | undefined,
  dateFrom: string,
  dateTo: string,
) {
  return useQuery({
    queryKey: ["attendance", "month", employeeId, dateFrom, dateTo],
    enabled: Number.isFinite(employeeId),
    queryFn: async () => {
      const params = new URLSearchParams({
        "filter[employee_id]": String(employeeId),
        "filter[date_from]": dateFrom,
        "filter[date_to]": dateTo,
        per_page: "100",
      });
      const response = await fetch(`/api/proxy/attendance?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Failed to load attendance");
      return ((await response.json()) as AttendanceListResult).data;
    },
  });
}

export type AdjustAttendanceInput = {
  check_in?: string | null;
  check_out?: string | null;
  status?: AttendanceStatus;
  reason: string;
};

export function useAdjustAttendance(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdjustAttendanceInput) =>
      browserFetch<AttendanceRecord>(`/attendance/${id}/adjust`, { method: "PATCH", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });
}
