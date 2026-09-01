"use client";

import { useState } from "react";
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
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-error";
import { formatMoney } from "@/lib/format-money";
import { usePayrollDisputes, useResolveDispute } from "@/services/payroll";
import type { PayrollDispute } from "@/types/payroll";

function ResolveDialog({ dispute, onClose }: { dispute: PayrollDispute | null; onClose: () => void }) {
  const resolve = useResolveDispute(dispute?.id ?? 0);
  const [resolution, setResolution] = useState<"UPHELD" | "REJECTED">("REJECTED");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await resolve.mutateAsync({ resolution, note });
      toast.success("Dispute resolved");
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={dispute !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve dispute</DialogTitle>
        </DialogHeader>
        {dispute && (
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{dispute.entry?.employee.full_name}</p>
              <p className="text-muted-foreground">{dispute.reason}</p>
            </div>
            <FormField label="Outcome">
              <Select value={resolution} onValueChange={(v) => setResolution(v as "UPHELD" | "REJECTED")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPHELD">Upheld — an adjustment will follow</SelectItem>
                  <SelectItem value="REJECTED">Rejected — explain why</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Explanation" description="Required — the employee sees this">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} required />
            </FormField>
            <DialogFooter>
              <Button type="submit" disabled={resolve.isPending || !note.trim()}>
                Record resolution
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PayrollDisputesList() {
  const { data: disputes, isLoading } = usePayrollDisputes();
  const [resolving, setResolving] = useState<PayrollDispute | null>(null);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!disputes || disputes.length === 0) {
    return <EmptyState title="No disputes" description="Payroll disputes raised by employees appear here." />;
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {disputes.map((dispute) => (
              <TableRow key={dispute.id}>
                <TableCell>
                  <div className="font-medium">{dispute.entry?.employee.full_name}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {dispute.entry ? formatMoney(dispute.entry.net_salary) : ""}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{dispute.entry?.period}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                  {dispute.reason}
                </TableCell>
                <TableCell>
                  <StatusChip tone={dispute.status === "OPEN" ? "warning" : "success"}>
                    {dispute.status}
                  </StatusChip>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    {dispute.status === "OPEN" && (
                      <Button variant="ghost" size="sm" onClick={() => setResolving(dispute)}>
                        Resolve
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ResolveDialog dispute={resolving} onClose={() => setResolving(null)} />
    </>
  );
}
