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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Action">
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
        <FormField label="From">
          <DatePicker value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} />
        </FormField>
      </div>

      {isLoading || !data ? (
        <PageLoadingSkeleton />
      ) : data.data.length === 0 ? (
        <EmptyState title="No audit entries" description="Nothing matches the current filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">{log.user?.name ?? "System"}</TableCell>
                    <TableCell className="text-sm">{label(log.action)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.entity_type ? `${log.entity_type} #${log.entity_id ?? ""}` : "—"}
                    </TableCell>
                    <TableCell className="max-w-md text-xs text-muted-foreground">
                      {log.reason ? <span>{log.reason}</span> : null}
                      {log.new_data ? (
                        <code className="ml-1 break-all">{JSON.stringify(log.new_data)}</code>
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
