import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import { ApiError } from "@/lib/api-error";
import type { ApiErrorBody } from "@/types/api";
import type { ChangePasswordInput, Profile, UpdateProfileInput } from "@/types/profile";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => browserFetch<Profile>("/auth/profile"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      browserFetch<Profile>("/auth/profile", { method: "PUT", body: input }),
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile);
    },
  });
}

async function photoRequest(method: "POST" | "DELETE", body?: FormData): Promise<Profile> {
  const response = await fetch("/api/profile/photo", { method, body });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      errorBody ?? { message: response.statusText, code: "UNKNOWN_ERROR" },
    );
  }

  return ((await response.json()) as { data: Profile }).data;
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("photo", file);
      return photoRequest("POST", form);
    },
    onSuccess: (profile) => queryClient.setQueryData(["profile"], profile),
  });
}

export function useRemovePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => photoRequest("DELETE"),
    onSuccess: (profile) => queryClient.setQueryData(["profile"], profile),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      browserFetch<void>("/auth/password", { method: "PUT", body: input }),
  });
}
