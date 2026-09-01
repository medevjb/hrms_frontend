import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { PersonalEvent } from "@/types/personal-events";

export function usePersonalEvents() {
  return useQuery({
    queryKey: ["personal-events"],
    queryFn: () => browserFetch<PersonalEvent[]>("/personal-events"),
  });
}

export type SavePersonalEventInput = {
  title: string;
  start_date: string;
  end_date: string;
  description?: string | null;
};

export function useCreatePersonalEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SavePersonalEventInput) =>
      browserFetch<PersonalEvent>("/personal-events", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-events"] }),
  });
}

export function useUpdatePersonalEvent(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<SavePersonalEventInput>) =>
      browserFetch<PersonalEvent>(`/personal-events/${id}`, { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-events"] }),
  });
}

export function useDeletePersonalEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      browserFetch<void>(`/personal-events/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-events"] }),
  });
}
