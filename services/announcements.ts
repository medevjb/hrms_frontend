import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { PaginationMeta } from "@/types/api";
import type {
  Announcement,
  AnnouncementAudienceType,
  AnnouncementStatus,
  AnnouncementType,
} from "@/types/announcements";

export type AnnouncementFilters = {
  mine?: boolean;
  status?: AnnouncementStatus;
  type?: AnnouncementType;
  page?: number;
};

type AnnouncementListResult = { data: Announcement[]; meta: PaginationMeta };

function buildQuery(filters: AnnouncementFilters): string {
  const params = new URLSearchParams();
  if (filters.mine) params.set("filter[mine]", "1");
  if (filters.status) params.set("filter[status]", filters.status);
  if (filters.type) params.set("filter[type]", filters.type);
  if (filters.page) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useAnnouncements(filters: AnnouncementFilters = {}) {
  return useQuery({
    queryKey: ["announcements", filters],
    queryFn: async () => {
      // browserFetch unwraps `.data` and drops `.meta`; the list needs
      // pagination, so it goes straight through the proxy like useLeaveRequests.
      const response = await fetch(`/api/proxy/announcements${buildQuery(filters)}`);
      if (!response.ok) throw new Error("Failed to load announcements");
      return (await response.json()) as AnnouncementListResult;
    },
  });
}

export type SaveAnnouncementInput = {
  type: AnnouncementType;
  title: string;
  content: string;
  audience_type: AnnouncementAudienceType;
  targets?: number[];
  acknowledgement_required?: boolean;
  publish_at?: string | null;
  expires_at?: string | null;
};

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveAnnouncementInput) =>
      browserFetch<Announcement>("/announcements", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useUpdateAnnouncement(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<SaveAnnouncementInput>) =>
      browserFetch<Announcement>(`/announcements/${id}`, { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function usePublishAnnouncement(id?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    // `id` can come from the hook call (a row action) or from the mutate
    // argument (publishing a draft straight after creating it).
    mutationFn: (publishId?: number) =>
      browserFetch<Announcement>(`/announcements/${publishId ?? id}/publish`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useMarkAnnouncementRead(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (acknowledge: boolean) =>
      browserFetch<Announcement>(`/announcements/${id}/read`, {
        method: "POST",
        body: { acknowledge },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => browserFetch<void>(`/announcements/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });
}
