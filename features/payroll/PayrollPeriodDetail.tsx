"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { ApiError } from "@/lib/api-error";
import { formatMoney } from "@/lib/format-money";
import { useGeneratePayroll, usePayrollEntries, usePayrollPeriod } from "@/services/payroll";
import { PayrollEntryDetailDialog } from "./PayrollEntryDetailDialog";

export function PayrollPeriodDetail({ periodId }: { periodId: number }) {
  const user = useCurrentUser();
  const canPrepare = user.permissions.includes("payroll.prepare");
  const { data: period, isLoading } = usePayrollPeriod(periodId);
  const { data: entries } = usePayrollEntries({ payroll_period_id: periodId });
  const generate = useGeneratePayroll(periodId);
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);

  if (isLoading || !period) {
    return <PageLoadingSkeleton />;
  }

  const rows = entries?.data ?? [];
  const isClosed = ["FINALIZED", "PAID", "LOCKED"].includes(period.status);

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 w-fit">
        <Link href="/payroll">
          <ArrowLeftIcon className="size-4" /> Payroll
        </Link>
      </Button>

      <PageHeader
        title={period.label}
        description={`${period.start_date} → ${period.end_date} · ${period.salary_day_calculation_method_used
          .toLowerCase()
          .replace(/_/g, " ")}`}
        actions={
          <div className="flex items-center gap-3">
            <StatusChip tone={isClosed ? "success" : "info"}>
              {period.status.replace(/_/g, " ")}
            </StatusChip>
            {canPrepare && !isClosed && (
              <Button
                disabled={generate.isPending}
                onClick={async () => {
                  try {
                    await generate.mutateAsync();
                    toast.success("Draft calculated");
                  } catch (caught) {
                    toast.error(caught instanceof ApiError ? caught.message : "Could not generate");
                  }
                }}
              >
                {rows.length > 0 ? "Recalculate draft" : "Generate draft"}
              </Button>
            )}
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No entries yet"
          description={
            canPrepare
              ? "Generate the draft to calculate every active employee's pay for this period."
              : "This period hasn't been calculated yet."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="font-medium">{entry.employee.full_name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {entry.employee.employee_code}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatMoney(entry.gross_earnings)}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {formatMoney(entry.total_deductions)}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium">
                    {formatMoney(entry.net_salary)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(entry.id)}>
                        Breakdown
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PayrollEntryDetailDialog
        entryId={selectedEntry}
        periodClosed={isClosed}
        onClose={() => setSelectedEntry(null)}
      />
    </>
  );
}
