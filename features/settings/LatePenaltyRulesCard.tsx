"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-error";
import { useLatePenaltyRules, useSaveLatePenaltyRules } from "@/services/late-penalty-rules";
import type { LatePenaltyDeductionMode, LatePenaltyOutcome } from "@/types/settings";

type DraftTier = {
  late_days_threshold: number;
  outcome: LatePenaltyOutcome;
  deduction_mode: LatePenaltyDeductionMode | null;
  deduction_value: string;
};

const emptyTier = (): DraftTier => ({
  late_days_threshold: 1,
  outcome: "WARNING",
  deduction_mode: null,
  deduction_value: "",
});

export function LatePenaltyRulesCard() {
  const { data: rules, isLoading } = useLatePenaltyRules();
  const save = useSaveLatePenaltyRules();
  const [editing, setEditing] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState<string | null>(null);
  const [tiers, setTiers] = useState<DraftTier[]>([emptyTier()]);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  function startEditing() {
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setTiers(
      rules && rules.length > 0
        ? rules.map((rule) => ({
            late_days_threshold: rule.late_days_threshold,
            outcome: rule.outcome,
            deduction_mode: rule.deduction_mode,
            deduction_value: rule.deduction_value ?? "",
          }))
        : [emptyTier()],
    );
    setEditing(true);
  }

  async function submit() {
    if (!effectiveFrom) return;
    try {
      await save.mutateAsync({
        effective_from: effectiveFrom,
        tiers: tiers.map((tier) => ({
          late_days_threshold: tier.late_days_threshold,
          outcome: tier.outcome,
          deduction_mode: tier.outcome === "DEDUCTION" ? tier.deduction_mode : null,
          deduction_value: tier.outcome === "DEDUCTION" ? tier.deduction_value : null,
        })),
      });
      toast.success("Late-penalty policy saved");
      setEditing(false);
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Could not save");
    }
  }

  function patchTier(index: number, patch: Partial<DraftTier>) {
    setTiers((cur) => cur.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Late-penalty policy</CardTitle>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            {rules && rules.length > 0 ? "New version" : "Set policy"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!editing ? (
          !rules || rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No late-penalty policy set — late days incur no deduction.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {rules.map((rule) => (
                <li key={rule.id} className="flex justify-between">
                  <span>{rule.late_days_threshold}+ late days</span>
                  <span className="text-muted-foreground">
                    {rule.outcome === "WARNING"
                      ? "Warning only"
                      : rule.deduction_mode === "DAY_FRACTION"
                        ? `${rule.deduction_value} day deduction`
                        : `${rule.deduction_value} fixed deduction`}
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="space-y-4">
            <div className="max-w-xs space-y-2">
              <label className="text-sm font-medium">Effective from</label>
              <DatePicker value={effectiveFrom} onChange={setEffectiveFrom} />
            </div>

            {tiers.map((tier, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Late days ≥</label>
                  <Input
                    type="number"
                    min={1}
                    value={tier.late_days_threshold}
                    onChange={(e) => patchTier(index, { late_days_threshold: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Outcome</label>
                  <Select
                    value={tier.outcome}
                    onValueChange={(v) => patchTier(index, { outcome: v as LatePenaltyOutcome })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="DEDUCTION">Deduction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tier.outcome === "DEDUCTION" ? (
                  <div className="flex gap-1">
                    <Select
                      value={tier.deduction_mode ?? "DAY_FRACTION"}
                      onValueChange={(v) =>
                        patchTier(index, { deduction_mode: v as LatePenaltyDeductionMode })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAY_FRACTION">Day fraction</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      inputMode="decimal"
                      placeholder="0.5"
                      value={tier.deduction_value}
                      onChange={(e) => patchTier(index, { deduction_value: e.target.value })}
                    />
                  </div>
                ) : (
                  <span />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setTiers((cur) => cur.filter((_, i) => i !== index))}
                  disabled={tiers.length === 1}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTiers((cur) => [...cur, emptyTier()])}
              >
                <PlusIcon className="size-4" /> Add tier
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button type="button" size="sm" disabled={save.isPending || !effectiveFrom} onClick={submit}>
                  Save policy
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
