import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { Shift, ShiftOverride } from "@/types/shifts";

export function useShifts() {
  return useQuery({
    queryKey: ["shifts"],
    queryFn: () => browserFetch<Shift[]>("/shifts"),
  });
}

export type SaveShiftInput = {
  name: string;
  start_time: string;
  end_time: string;
  expected_work_minutes: number;
  break_minutes?: number;
  late_grace_minutes?: number | null;
  active?: boolean;
};

export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveShiftInput) =>
      browserFetch<Shift>("/shifts", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useUpdateShift(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<SaveShiftInput>) =>
      browserFetch<Shift>(`/shifts/${id}`, { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useCreateShiftOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { employee_id: number; shift_id: number; work_date: string; reason: string }) =>
      browserFetch<ShiftOverride>("/shift-overrides", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}
