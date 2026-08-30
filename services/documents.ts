import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { ApiErrorBody, ApiSuccess } from "@/types/api";
import { ApiError } from "@/lib/api-error";
import type { DocumentCategory, EmployeeDocument } from "@/types/documents";

export function useEmployeeDocuments(employeeId: number) {
  return useQuery({
    queryKey: ["employee-documents", employeeId],
    queryFn: () => browserFetch<EmployeeDocument[]>(`/employees/${employeeId}/documents`),
    enabled: Number.isFinite(employeeId),
  });
}

export function useUploadDocument(employeeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; category: DocumentCategory; file: File }) => {
      // multipart/form-data — browserFetch is JSON-only, so this goes
      // straight through the proxy with a FormData body.
      const body = new FormData();
      body.set("title", input.title);
      body.set("category", input.category);
      body.set("file", input.file);

      const response = await fetch(`/api/proxy/employees/${employeeId}/documents`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
        throw new ApiError(response.status, errorBody ?? { message: "Upload failed", code: "UNKNOWN" });
      }

      return ((await response.json()) as ApiSuccess<EmployeeDocument>).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-documents", employeeId] }),
  });
}

export function useDeleteDocument(employeeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => browserFetch<void>(`/documents/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-documents", employeeId] }),
  });
}

export function documentDownloadUrl(id: number): string {
  return `/api/proxy/documents/${id}/download`;
}
