import { useQuery } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { Role } from "@/types/roles";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => browserFetch<Role[]>("/roles"),
  });
}

export function useRole(id: number) {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: () => browserFetch<Role>(`/roles/${id}`),
    enabled: Number.isFinite(id),
  });
}
