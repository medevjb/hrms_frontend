import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { Holiday, HolidayImportResult, HolidayType } from "@/types/holidays";

export function useHolidays() {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: () => browserFetch<Holiday[]>("/holidays"),
  });
}

export type SaveHolidayInput = {
  title: string;
  date: string;
  type: HolidayType;
  description?: string | null;
  office_location?: string | null;
  active?: boolean;
};

export function useCreateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveHolidayInput) =>
      browserFetch<Holiday>("/holidays", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

/**
 * Pulls the standard Bangladesh national public holidays from Google's
 * public calendar (backend runs the same importer weekly). Safe to call
 * repeatedly — it upserts by the calendar event's id and never touches a
 * manually added or edited holiday.
 */
export function useImportBangladeshHolidays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      browserFetch<HolidayImportResult>("/holidays/import", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

export function useUpdateHoliday(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<SaveHolidayInput>) =>
      browserFetch<Holiday>(`/holidays/${id}`, { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => browserFetch<void>(`/holidays/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holidays"] }),
  });
}
