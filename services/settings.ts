import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-error";
import { browserFetch } from "@/lib/browser-api";
import type { ApiErrorBody, ApiSuccess } from "@/types/api";
import type {
  AttendanceSettings,
  Branding,
  LeaveSettings,
  MailSettings,
  MailSettingsInput,
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

// --- Branding ------------------------------------------------------------

export function useBrandingSettings() {
  return useQuery({
    queryKey: ["settings", "branding"],
    queryFn: () => browserFetch<Branding>("/settings/branding"),
  });
}

export type BrandingUpdateInput = {
  company_name?: string;
  app_title?: string | null;
  logo?: File | null;
  favicon?: File | null;
  remove_logo?: boolean;
  remove_favicon?: boolean;
};

export function useUpdateBranding() {
  const queryClient = useQueryClient();

  return useMutation({
    // multipart/form-data — browserFetch is JSON-only, so this goes
    // straight through the proxy with a FormData body.
    mutationFn: async (input: BrandingUpdateInput) => {
      const body = new FormData();
      if (input.company_name !== undefined) body.set("company_name", input.company_name);
      if (input.app_title !== undefined) body.set("app_title", input.app_title ?? "");
      if (input.logo) body.set("logo", input.logo);
      if (input.favicon) body.set("favicon", input.favicon);
      if (input.remove_logo) body.set("remove_logo", "1");
      if (input.remove_favicon) body.set("remove_favicon", "1");

      const response = await fetch("/api/proxy/settings/branding", {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
        throw new ApiError(response.status, errorBody ?? { message: "Update failed", code: "UNKNOWN" });
      }

      return ((await response.json()) as ApiSuccess<Branding>).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "branding"] });
      queryClient.invalidateQueries({ queryKey: ["settings", "organization"] });
      queryClient.invalidateQueries({ queryKey: ["branding"] });
    },
  });
}

// --- Email --------------------------------------------------------------

export function useMailSettings() {
  return useQuery({
    queryKey: ["settings", "mail"],
    queryFn: () => browserFetch<MailSettings>("/settings/mail"),
  });
}

export function useUpdateMailSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MailSettingsInput) =>
      browserFetch<MailSettings>("/settings/mail", { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "mail"] }),
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: (to: string) =>
      browserFetch<{ sent_to: string }>("/settings/mail/test", { method: "POST", body: { to } }),
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
