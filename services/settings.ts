import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type {
  AttendanceSettings,
  LeaveSettings,
  OrganizationSettingsData,
  OvertimeSettings,
  PayrollSettings,
} from "@/types/settings";

export function useOrganizationSettings() {
  return useQuery({
    queryKey: ["settings", "organization"],
    queryFn: () => browserFetch<OrganizationSettingsData>("/settings/organization"),
  });
}

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<OrganizationSettingsData>) =>
      browserFetch<OrganizationSettingsData>("/settings/organization", { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "organization"] }),
  });
}

export function useAttendanceSettings() {
  return useQuery({
    queryKey: ["settings", "attendance"],
    queryFn: () => browserFetch<AttendanceSettings>("/settings/attendance"),
  });
}

export function useUpdateAttendanceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<AttendanceSettings>) =>
      browserFetch<AttendanceSettings>("/settings/attendance", { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "attendance"] }),
  });
}

export function useOvertimeSettings() {
  return useQuery({
    queryKey: ["settings", "overtime"],
    queryFn: () => browserFetch<OvertimeSettings>("/settings/overtime"),
  });
}

export function useUpdateOvertimeSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<OvertimeSettings>) =>
      browserFetch<OvertimeSettings>("/settings/overtime", { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "overtime"] }),
  });
}

export function usePayrollSettings() {
  return useQuery({
    queryKey: ["settings", "payroll"],
    queryFn: () => browserFetch<PayrollSettings>("/settings/payroll"),
  });
}

export function useUpdatePayrollSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<PayrollSettings>) =>
      browserFetch<PayrollSettings>("/settings/payroll", { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "payroll"] }),
  });
}

export function useLeaveSettings() {
  return useQuery({
    queryKey: ["settings", "leave"],
    queryFn: () => browserFetch<LeaveSettings>("/settings/leave"),
  });
}

export function useUpdateLeaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<LeaveSettings>) =>
      browserFetch<LeaveSettings>("/settings/leave", { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "leave"] }),
  });
}
