"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
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
      toast.success("Salary updated");
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set salary</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormField label="Effective from" description="Must be after the current version">
            <DatePicker value={effectiveFrom} onChange={setEffectiveFrom} />
          </FormField>
          {(components ?? []).map((component) => (
            <FormField key={component.id} label={component.name}>
              <Input
                inputMode="decimal"
                value={amounts[component.id] ?? ""}
                onChange={(e) => setAmounts((cur) => ({ ...cur, [component.id]: e.target.value }))}
              />
            </FormField>
          ))}
          <DialogFooter>
            <Button type="submit" disabled={assign.isPending || !effectiveFrom}>
              Save salary
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Salary</CardTitle>
        {canManage && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            {current ? "Revise" : "Set salary"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !current ? (
          <p className="text-sm text-muted-foreground">No salary on record for {employeeName}.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Gross monthly</span>
              <span className="font-mono text-lg font-semibold">
                {formatMoney(current.gross_monthly)}
              </span>
            </div>
            <div className="divide-y divide-border border-t border-border">
              {current.components.map((component) => (
                <div key={component.salary_component_id} className="flex justify-between py-1.5 text-sm">
                  <span>{component.name}</span>
                  <span className="font-mono">{formatMoney(component.amount)}</span>
                </div>
              ))}
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              Effective {current.effective_from}
              {data && data.history.length > 1 ? ` · ${data.history.length} versions on record` : ""}
            </p>
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
