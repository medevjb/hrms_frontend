"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { formatMoney } from "@/lib/format-money";
import { usePayrollEntry } from "@/services/payroll";
import type { PayrollEntryLine } from "@/types/payroll";
import { AdjustPayrollEntryDialog } from "./AdjustPayrollEntryDialog";

function LineRow({ line }: { line: PayrollEntryLine }) {
  const sign = line.category === "DEDUCTION" ? "−" : "+";
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="flex items-center gap-2">
        {line.label}
        {line.is_manual && <span className="text-xs text-muted-foreground">(manual)</span>}
      </span>
      <span
        className={`font-mono ${line.category === "DEDUCTION" ? "text-rose-600 dark:text-rose-400" : ""}`}
      >
        {sign} {formatMoney(line.amount)}
      </span>
    </div>
  );
}

export function PayrollEntryDetailDialog({
  entryId,
  periodClosed,
  onClose,
}: {
  entryId: number | null;
  periodClosed: boolean;
  onClose: () => void;
}) {
  const user = useCurrentUser();
  const canAdjust = user.permissions.includes("payroll.adjust");
  const { data: entry, isLoading } = usePayrollEntry(entryId);
  const [adjusting, setAdjusting] = useState(false);

  const earnings = entry?.lines?.filter((line) => line.category === "EARNING") ?? [];
  const deductions = entry?.lines?.filter((line) => line.category === "DEDUCTION") ?? [];

  return (
    <>
      <Dialog open={entryId !== null} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{entry ? entry.employee.full_name : "Payroll breakdown"}</DialogTitle>
          </DialogHeader>

          {isLoading || !entry ? (
            <PageLoadingSkeleton />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <span className="text-muted-foreground">Daily salary</span>
                <span className="text-right font-mono">{formatMoney(entry.daily_salary)}</span>
                <span className="text-muted-foreground">Late / absent / unpaid</span>
                <span className="text-right font-mono">
                  {entry.late_days} / {entry.absent_days} / {entry.unpaid_leave_days}
                </span>
                <span className="text-muted-foreground">Overtime days</span>
                <span className="text-right font-mono">{entry.overtime_days}</span>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Earnings
                </p>
                {earnings.map((line) => (
                  <LineRow key={line.id} line={line} />
                ))}
              </div>

              {deductions.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Deductions
                  </p>
                  {deductions.map((line) => (
                    <LineRow key={line.id} line={line} />
                  ))}
                </div>
              )}

              <div className="space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross</span>
                  <span className="font-mono">{formatMoney(entry.gross_earnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deductions</span>
                  <span className="font-mono">{formatMoney(entry.total_deductions)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Net</span>
                  <span className="font-mono">{formatMoney(entry.net_salary)}</span>
                </div>
              </div>

              {canAdjust && !periodClosed && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setAdjusting(true)}>
                    Add adjustment
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {entry && (
        <AdjustPayrollEntryDialog
          entryId={entry.id}
          opened={adjusting}
          onClose={() => setAdjusting(false)}
        />
      )}
    </>
  );
}
