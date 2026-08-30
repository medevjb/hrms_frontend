"use client";

import { useState } from "react";
import {
  AlertCircleIcon,
  CalendarIcon,
  DollarSignIcon,
  HistoryIcon,
  PlusIcon,
  TrendingUpIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { ApiError } from "@/lib/api-error";
import { formatMoney } from "@/lib/format-money";
import { useAssignSalary, useEmployeeSalary, useSalaryComponents } from "@/services/payroll";

function AssignDialog({
  employeeId,
  opened,
  onClose,
  initial,
}: {
  employeeId: number;
  opened: boolean;
  onClose: () => void;
  initial: Record<number, string>;
}) {
  const { data: components } = useSalaryComponents();
  const assign = useAssignSalary(employeeId);
  const [effectiveFrom, setEffectiveFrom] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<number, string>>(initial);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!effectiveFrom) return;

    const payload = Object.entries(amounts)
      .filter(([, amount]) => amount !== "" && Number(amount) > 0)
      .map(([id, amount]) => ({ salary_component_id: Number(id), amount }));

    try {
      await assign.mutateAsync({ effective_from: effectiveFrom, components: payload });
      toast.success("Salary updated successfully");
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <DollarSignIcon className="size-5 text-primary" />
            Set Salary Components
          </DialogTitle>
          <DialogDescription>
            Assign component breakdown and effective start date for this employee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormField label="Effective From Date" description="Must be on or after current active version date">
            <DatePicker value={effectiveFrom} onChange={setEffectiveFrom} />
          </FormField>

          <div className="space-y-3 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Component Breakdown
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {(components ?? []).map((component) => (
                <FormField key={component.id} label={component.name}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      $
                    </span>
                    <Input
                      className="pl-7"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amounts[component.id] ?? ""}
                      onChange={(e) => setAmounts((cur) => ({ ...cur, [component.id]: e.target.value }))}
                    />
                  </div>
                </FormField>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={assign.isPending || !effectiveFrom}>
              {assign.isPending ? "Saving..." : "Save Salary Revision"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EmployeeSalarySection({
  employeeId,
  employeeName,
}: {
  employeeId: number;
  employeeName: string;
}) {
  const user = useCurrentUser();
  const canView =
    user.permissions.includes("employee.financial.view") ||
    user.permissions.includes("employee.financial.manage");
  const canManage = user.permissions.includes("employee.financial.manage");
  const { data, isLoading } = useEmployeeSalary(employeeId);
  const [editing, setEditing] = useState(false);

  if (!canView) return null;

  const current = data?.current ?? null;
  const initialAmounts: Record<number, string> = {};
  current?.components.forEach((component) => {
    initialAmounts[component.salary_component_id] = component.amount;
  });

  return (
    <Card className="overflow-hidden border border-border shadow-sm">
      <CardHeader className="bg-muted/30 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSignIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
              Compensation & Salary Details
            </CardTitle>
            <CardDescription className="text-xs">
              Current salary structure, allowance components, and revision history.
            </CardDescription>
          </div>
          {canManage && (
            <Button size="sm" variant={current ? "outline" : "default"} onClick={() => setEditing(true)}>
              {current ? (
                <>
                  <TrendingUpIcon className="mr-1.5 size-3.5" />
                  Revise Salary
                </>
              ) : (
                <>
                  <PlusIcon className="mr-1.5 size-3.5" />
                  Set Initial Salary
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-12 bg-muted rounded-md animate-pulse" />
            <div className="h-24 bg-muted/60 rounded-md animate-pulse" />
          </div>
        ) : !current ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
            <div className="rounded-full bg-muted p-3">
              <DollarSignIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No salary structure on record</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Salary component structure has not been set for {employeeName} yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Gross Summary Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Total Gross Monthly Salary
                </span>
                <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                  {formatMoney(current.gross_monthly)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border text-xs font-normal">
                  <CalendarIcon className="size-3 text-muted-foreground" />
                  Effective {current.effective_from}
                </Badge>
                {data && data.history.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs font-normal">
                    <HistoryIcon className="size-3 text-muted-foreground" />
                    {data.history.length} {data.history.length === 1 ? "version" : "versions"}
                  </Badge>
                )}
              </div>
            </div>

            {/* Components Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Salary Component Breakdown
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {current.components.map((component) => (
                  <div
                    key={component.salary_component_id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{component.name}</span>
                    <span className="text-sm font-semibold font-mono text-foreground">
                      {formatMoney(component.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {canManage && (
        <AssignDialog
          employeeId={employeeId}
          opened={editing}
          onClose={() => setEditing(false)}
          initial={initialAmounts}
        />
      )}
    </Card>
  );
}

