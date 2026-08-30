import { useQuery } from "@tanstack/react-query";
import type { PaginationMeta } from "@/types/api";
import type { AuditLog } from "@/types/audit";

export type AuditFilters = { action?: string; date_from?: string | null; page?: number };

type AuditListResult = { data: AuditLog[]; meta: PaginationMeta };

export function useAuditLogs(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.action) params.set("filter[action]", filters.action);
      if (filters.date_from) params.set("filter[date_from]", filters.date_from);
      if (filters.page) params.set("page", String(filters.page));
      const query = params.toString();
      const response = await fetch(`/api/proxy/audit-logs${query ? `?${query}` : ""}`);
      if (!response.ok) throw new Error("Failed to load audit logs");
      return (await response.json()) as AuditListResult;
    },
  });
}
