import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
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
