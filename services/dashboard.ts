import { useQuery } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { DashboardPayload } from "@/types/dashboard";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => browserFetch<DashboardPayload>("/dashboard"),
  });
}
