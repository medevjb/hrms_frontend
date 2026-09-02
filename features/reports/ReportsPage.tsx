"use client";

import { useMemo, useState } from "react";
import { DownloadIcon } from "lucide-react";
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
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useReportingPeriod } from "@/hooks/use-reporting-period";
import { useDepartments } from "@/services/departments";
import { reportExportUrl, useReport, useReportTypes } from "@/services/reports";
import type { ReportFilters, ReportType } from "@/types/reports";

export function ReportsPage() {
  const user = useCurrentUser();
  const canExport = user.permissions.includes("report.export");
  const { data: types } = useReportTypes();
  const { data: departments } = useDepartments();
  const { period } = useReportingPeriod();

  const [type, setType] = useState<ReportType | null>(null);
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string>("");

  const filters: ReportFilters = useMemo(
    () => ({
      date_from: dateFrom,
      date_to: dateTo,
      department_id: departmentId ? Number(departmentId) : null,
    }),
    [dateFrom, dateTo, departmentId],
  );

  const { data: report, isFetching } = useReport(type, filters);
  const selectedInfo = types?.find((t) => t.type === type);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Pick a report, narrow it down, and preview or export as CSV."
        actions={
          type && canExport && report && report.total > 0 ? (
            <Button asChild>
              <a href={reportExportUrl(type, filters)} target="_blank" rel="noreferrer">
                <DownloadIcon className="size-4" /> Export CSV
              </a>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Report Type" htmlFor="report_type">
            <Select value={type ?? ""} onValueChange={(v) => setType(v as ReportType)}>
              <SelectTrigger id="report_type" className="w-full">
                <SelectValue placeholder="Choose a report" />
              </SelectTrigger>
              <SelectContent>
                {(types ?? []).map((info) => (
                  <SelectItem key={info.type} value={info.type}>
                    {info.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {!selectedInfo?.uses_payroll_period && (
            <>
              <FormField
                label="From Date"
                description={
                  !dateFrom && !dateTo ? `Defaults to ${period.label} (${period.startDate} → ${period.endDate})` : undefined
                }
              >
                <DatePicker value={dateFrom} onChange={setDateFrom} />
              </FormField>
              <FormField label="To Date">
                <DatePicker value={dateTo} onChange={setDateTo} />
              </FormField>
            </>
          )}

          <FormField label="Department" htmlFor="report_department">
            <Select value={departmentId || "all"} onValueChange={(v) => setDepartmentId(v === "all" ? "" : v)}>
              <SelectTrigger id="report_department" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {(departments ?? []).map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </div>

      {!type ? (
        <EmptyState title="No report selected" description="Choose a report above to see a preview." />
      ) : isFetching || !report ? (
        <PageLoadingSkeleton />
      ) : report.rows.length === 0 ? (
        <EmptyState title="No rows" description="No data matches the current filters." />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {report.total} row{report.total === 1 ? "" : "s"}
              {report.truncated ? ` · showing the first ${report.rows.length}, export for all` : ""}
            </span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  {report.columns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map((row, index) => (
                  <TableRow key={index}>
                    {report.columns.map((column) => (
                      <TableCell key={column.key} className="text-sm font-medium whitespace-nowrap">
                        {row[column.key] ?? ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}
