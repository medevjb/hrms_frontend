"use client";

import Link from "next/link";
import {
  AlarmClockIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  ChevronRightIcon,
  FileWarningIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";

type Props = {
  totalEmployees?: number;
  departmentsCount?: number;
  teamsCount?: number;
  pendingApprovals?: {
    leave?: number;
    overtime?: number;
    holiday_notices?: number;
    payroll_disputes?: number;
  };
  openPayrollPeriods?: number;
};

export function ManagerWorkforceSection({
  totalEmployees = 48,
  departmentsCount = 6,
  teamsCount = 14,
  pendingApprovals = { leave: 3, overtime: 1, holiday_notices: 0, payroll_disputes: 0 },
  openPayrollPeriods = 1,
}: Props) {
  const totalQueue = Object.values(pendingApprovals).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Management & Workforce Hub
          </h2>
          <p className="text-xs text-muted-foreground">
            Operational queue, active staff metrics, and pending manager decisions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Workforce Stat */}
        <StatTile
          label="Active workforce"
          value={totalEmployees}
          icon={UsersIcon}
          tone="violet"
          subtext={`${departmentsCount} Depts • ${teamsCount} Teams`}
        />

        {/* Approvals Stat */}
        <StatTile
          label="Approvals waiting on you"
          value={totalQueue}
          icon={FileWarningIcon}
          tone="amber"
          subtext={totalQueue > 0 ? "Action items in queue" : "Queue is clear"}
        />

        {/* Open Payroll */}
        <StatTile
          label="Open payroll periods"
          value={openPayrollPeriods}
          icon={WalletIcon}
          tone="blue"
          subtext="Ready for processing"
        />
      </div>

      {/* Approvals detailed quick queue */}
      {totalQueue > 0 && (
        <Card className="border-border/70 bg-card shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">Pending Approval Action Items</CardTitle>
              <span className="font-mono text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {totalQueue} pending
              </span>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            {pendingApprovals.leave ? (
              <Link
                href="/leave"
                className="flex items-center justify-between py-2.5 group hover:bg-muted/40 px-2 rounded-lg transition-colors text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarClockIcon className="size-4 text-indigo-600" />
                  <span>Leave approvals</span>
                </div>
                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded-full">
                  {pendingApprovals.leave} <ChevronRightIcon className="size-3 text-muted-foreground" />
                </span>
              </Link>
            ) : null}

            {pendingApprovals.overtime ? (
              <Link
                href="/overtime"
                className="flex items-center justify-between py-2.5 group hover:bg-muted/40 px-2 rounded-lg transition-colors text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <AlarmClockIcon className="size-4 text-amber-600" />
                  <span>Overtime approvals</span>
                </div>
                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded-full">
                  {pendingApprovals.overtime} <ChevronRightIcon className="size-3 text-muted-foreground" />
                </span>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
