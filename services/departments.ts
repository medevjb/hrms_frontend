import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { Department } from "@/types/organization";

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => browserFetch<Department[]>("/departments"),
  });
}

export type SaveDepartmentInput = {
  name: string;
  description?: string;
  operation_manager_id?: number | null;
  active?: boolean;
};

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveDepartmentInput) =>
      browserFetch<Department>("/departments", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
}

export function useUpdateDepartment(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<SaveDepartmentInput>) =>
      browserFetch<Department>(`/departments/${id}`, { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => browserFetch<void>(`/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
}
