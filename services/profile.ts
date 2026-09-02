import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-error";
import { browserFetch } from "@/lib/browser-api";
import type { ApiErrorBody, ApiSuccess } from "@/types/api";
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

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      browserFetch<void>("/auth/password", { method: "PUT", body: input }),
  });
}

/** Upload or replace the signed-in user's profile photo (multipart). */
export function useUpdateProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.set("photo", file);

      const response = await fetch("/api/proxy/auth/profile/photo", {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
        throw new ApiError(response.status, errorBody ?? { message: "Upload failed", code: "UNKNOWN" });
      }

      return ((await response.json()) as ApiSuccess<Profile>).data;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile);
      // The same person shows up in the employee list and detail with a
      // versioned photo_url — refetch so the new photo appears there too.
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => browserFetch<Profile>("/auth/profile/photo", { method: "DELETE" }),
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
