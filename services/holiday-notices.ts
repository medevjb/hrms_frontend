import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { HolidayNotice, HolidayNoticeStatus } from "@/types/holidays";

export function useHolidayNotices(status?: HolidayNoticeStatus) {
  return useQuery({
    queryKey: ["holiday-notices", status ?? "all"],
    queryFn: () =>
      browserFetch<HolidayNotice[]>(
        `/holiday-notices${status ? `?filter[status]=${status}` : ""}`,
      ),
  });
}

export type ApproveHolidayNoticeInput = {
  message?: string;
  closure_note?: string | null;
  return_date?: string | null;
};

export function useApproveHolidayNotice(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApproveHolidayNoticeInput) =>
      browserFetch<HolidayNotice>(`/holiday-notices/${id}/approve`, {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holiday-notices"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

export function useDismissHolidayNotice(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      browserFetch<HolidayNotice>(`/holiday-notices/${id}/dismiss`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holiday-notices"] }),
  });
}

// The PDF is a private authorized stream (docs/PRD.md §82) — link through
// the proxy so the session cookie's token is attached server-side.
export function holidayNoticeDownloadUrl(id: number): string {
  return `/api/proxy/holiday-notices/${id}/download`;
}
