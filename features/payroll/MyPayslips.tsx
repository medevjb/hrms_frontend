"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format-money";
import { usePayrollEntries } from "@/services/payroll";
import { PayrollEntryDetailDialog } from "./PayrollEntryDetailDialog";

export function MyPayslips() {
  const { data, isLoading } = usePayrollEntries({ mine: true });
  const [selected, setSelected] = useState<number | null>(null);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  const rows = data?.data ?? [];

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No payslips yet"
        description="Your payslip appears here once payroll has been run for a period."
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Net</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.period?.label ?? "—"}</TableCell>
                <TableCell>
                  <StatusChip tone={entry.status === "FINALIZED" ? "success" : "info"}>
                    {entry.status.replace(/_/g, " ")}
                  </StatusChip>
                </TableCell>
                <TableCell className="font-mono text-sm font-medium">
                  {formatMoney(entry.net_salary)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(entry.id)}>
                      View
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PayrollEntryDetailDialog entryId={selected} periodClosed onClose={() => setSelected(null)} />
    </>
  );
}
