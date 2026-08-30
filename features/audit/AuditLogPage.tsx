"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/PageHeader";
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
import { useAuditLogs } from "@/services/audit";
import { AUDIT_ACTIONS } from "@/types/audit";

function label(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AuditLogPage() {
  const [action, setAction] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAuditLogs({ action: action || undefined, date_from: dateFrom, page });

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every sensitive action, append-only. Salary changes, payroll adjustments, approvals, role grants, exports."
      />

      <div className="mb-6 rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Filter by Action">
            <Select value={action || "all"} onValueChange={(v) => { setAction(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {AUDIT_ACTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {label(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="From Date">
            <DatePicker value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} />
          </FormField>
        </div>
      </div>

      {isLoading || !data ? (
        <PageLoadingSkeleton />
      ) : data.data.length === 0 ? (
        <EmptyState title="No audit entries" description="Nothing matches the current filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target Entity</TableHead>
                  <TableHead>Details & Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">{log.user?.name ?? "System"}</TableCell>
                    <TableCell>
                      <StatusChip tone="info">{label(log.action)}</StatusChip>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.entity_type ? `${log.entity_type} #${log.entity_id ?? ""}` : "—"}
                    </TableCell>
                    <TableCell className="max-w-md text-xs text-muted-foreground">
                      {log.reason ? <span className="font-medium text-foreground mr-1">{log.reason}</span> : null}
                      {log.new_data ? (
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] break-all">{JSON.stringify(log.new_data)}</code>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {data.meta.total} entr{data.meta.total === 1 ? "y" : "ies"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
