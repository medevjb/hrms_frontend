"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmployeeSelect } from "@/features/organization/EmployeeSelect";
import { useLeaveBalances } from "@/services/leave";
import type { LeaveBalance } from "@/types/leave";
import { AdjustLeaveBalanceDialog } from "./AdjustLeaveBalanceDialog";

export function EmployeeLeaveBalances() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<LeaveBalance | null>(null);

  const { data: balances, isLoading } = useLeaveBalances(
    employeeId ? Number(employeeId) : undefined,
  );

  return (
    <div className="space-y-5">
      <div className="max-w-sm">
        <EmployeeSelect label="Employee" value={employeeId} onChange={setEmployeeId} />
      </div>

      {!employeeId ? (
        <EmptyState
          title="Pick an employee"
          description="Choose someone to see their leave balances and make adjustments."
        />
      ) : isLoading ? (
        <PageLoadingSkeleton />
      ) : !balances || balances.length === 0 ? (
        <EmptyState title="No balances" description="This employee has no leave balances yet." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave type</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Available</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((balance) => (
                <TableRow key={balance.id}>
                  <TableCell>
                    <div className="font-medium">{balance.leave_type.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {balance.leave_type.code}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{balance.leave_year}</TableCell>
                  <TableCell className="font-mono text-sm">{balance.balance} days</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setAdjusting(balance)}>
                        Adjust
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdjustLeaveBalanceDialog balance={adjusting} onClose={() => setAdjusting(null)} />
    </div>
  );
}
