"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { ApiError } from "@/lib/api-error";
import { formatMoney } from "@/lib/format-money";
import { useCreatePayrollPeriod, usePayrollPeriods } from "@/services/payroll";
import type { PayrollPeriodStatus } from "@/types/payroll";

const STATUS_TONE: Record<PayrollPeriodStatus, StatusTone> = {
  UPCOMING: "neutral",
  OPEN: "info",
  PROCESSING: "info",
  REVIEW: "warning",
  EMPLOYEE_CONFIRMATION: "warning",
  FINALIZED: "success",
  PAID: "success",
  LOCKED: "neutral",
};

function CreatePeriodDialog({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const create = useCreatePayrollPeriod();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({ year, month });
      toast.success("Period created");
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New payroll period</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Year">
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </FormField>
            <FormField label="Month">
              <Input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PayrollPeriodsList() {
  const user = useCurrentUser();
  const canPrepare = user.permissions.includes("payroll.prepare");
  const { data: periods, isLoading } = usePayrollPeriods();
  const [creating, setCreating] = useState(false);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      {canPrepare && (
        <div className="flex justify-end">
          <Button onClick={() => setCreating(true)}>New period</Button>
        </div>
      )}

      {!periods || periods.length === 0 ? (
        <EmptyState
          title="No payroll periods"
          description="Create a period for the month, then generate the draft to calculate every employee's pay."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Net total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-bold text-foreground">{period.label}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {period.start_date} → {period.end_date}
                  </TableCell>
                  <TableCell>
                    <StatusChip tone={STATUS_TONE[period.status]}>
                      {period.status.replace(/_/g, " ")}
                    </StatusChip>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold">{period.entry_count ?? 0}</TableCell>
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    {period.net_total ? formatMoney(period.net_total) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="rounded-xl font-semibold" asChild>
                      <Link href={`/payroll/${period.id}`}>Open period</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreatePeriodDialog opened={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
