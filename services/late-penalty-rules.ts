import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { LatePenaltyRule } from "@/types/settings";

export function useLatePenaltyRules() {
  return useQuery({
    queryKey: ["late-penalty-rules"],
    queryFn: () => browserFetch<LatePenaltyRule[]>("/settings/late-penalty-rules"),
  });
}

export type SaveLatePenaltyRulesInput = {
  effective_from: string;
  tiers: {
    late_days_threshold: number;
    outcome: "WARNING" | "DEDUCTION";
    deduction_mode?: "DAY_FRACTION" | "FIXED_AMOUNT" | null;
    deduction_value?: string | null;
  }[];
};

export function useSaveLatePenaltyRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveLatePenaltyRulesInput) =>
      browserFetch<LatePenaltyRule[]>("/settings/late-penalty-rules", { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["late-penalty-rules"] }),
  });
}
