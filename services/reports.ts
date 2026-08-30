import { useQuery } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { ReportFilters, ReportResult, ReportType, ReportTypeInfo } from "@/types/reports";

function filterQuery(filters: ReportFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined && value !== "") {
      params.set(`filter[${key}]`, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useReportTypes() {
  return useQuery({
    queryKey: ["report-types"],
    queryFn: () => browserFetch<ReportTypeInfo[]>("/reports"),
  });
}

export function useReport(type: ReportType | null, filters: ReportFilters) {
  return useQuery({
    queryKey: ["report", type, filters],
    queryFn: () => browserFetch<ReportResult>(`/reports/${type}${filterQuery(filters)}`),
    enabled: type !== null,
  });
}

export function reportExportUrl(type: ReportType, filters: ReportFilters): string {
  return `/api/proxy/reports/${type}/export${filterQuery(filters)}`;
}
