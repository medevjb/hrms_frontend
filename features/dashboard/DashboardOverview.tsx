"use client";

import Link from "next/link";
import {
  AlarmClockIcon,
  Building2Icon,
  CalendarClockIcon,
  FileWarningIcon,
  MegaphoneIcon,
  UserCheckIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusChip } from "@/components/ui/status-chip";
import { TodayAttendanceCard } from "@/features/attendance/TodayAttendanceCard";
import { useDashboard } from "@/services/dashboard";

function label(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DashboardOverview() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <PageLoadingSkeleton />;
  }

  const w = data.widgets;
  const approvals = w.pending_approvals ?? {};
  const totalApprovals = Object.values(approvals).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Overview"
        description={
          data.roles.length > 0
            ? `Signed in as ${data.roles.join(", ")}.`
            : "A live snapshot of your day."
        }
      />

      <TodayAttendanceCard />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {w.workforce && (
          <StatTile label="Total employees" value={w.workforce.total} icon={UsersIcon} tone="violet" />
        )}
        {w.workforce && (
          <StatTile
            label="Departments / teams"
            value={`${w.workforce.departments} / ${w.workforce.teams}`}
            icon={Building2Icon}
            tone="blue"
          />
        )}
        {w.attendance_today && (
          <StatTile
            label="In / late / absent today"
            value={`${w.attendance_today.present} / ${w.attendance_today.late} / ${w.attendance_today.absent}`}
            icon={UserCheckIcon}
            tone="emerald"
          />
        )}
        {w.pending_approvals && (
          <StatTile label="Waiting on you" value={totalApprovals} icon={FileWarningIcon} tone="amber" />
        )}
        {w.payroll && (
          <StatTile
            label="Open payroll periods"
            value={w.payroll.open_periods}
            icon={WalletIcon}
            tone="blue"
          />
        )}
        {w.me && (
          <StatTile
            label="My pending leave"
            value={w.me.pending_leave}
            icon={CalendarClockIcon}
            tone="violet"
          />
        )}
        {w.announcements && (
          <StatTile
            label="Unread announcements"
            value={w.announcements.unread}
            icon={MegaphoneIcon}
            tone="amber"
          />
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {w.pending_approvals && (
          <Card>
            <CardHeader>
              <CardTitle>Waiting on you</CardTitle>
              <CardDescription>Items in your approval queue right now.</CardDescription>
            </CardHeader>
            <CardContent>
              {totalApprovals === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Your queue is clear.</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {approvals.leave ? (
                    <li className="flex justify-between py-2">
                      <Link href="/leave" className="hover:underline">
                        Leave approvals
                      </Link>
                      <span className="font-mono">{approvals.leave}</span>
                    </li>
                  ) : null}
                  {approvals.overtime ? (
                    <li className="flex justify-between py-2">
                      <Link href="/overtime" className="hover:underline">
                        Overtime approvals
                      </Link>
                      <span className="font-mono">{approvals.overtime}</span>
                    </li>
                  ) : null}
                  {approvals.holiday_notices ? (
                    <li className="flex justify-between py-2">
                      <Link href="/holidays" className="hover:underline">
                        Holiday notices to sign
                      </Link>
                      <span className="font-mono">{approvals.holiday_notices}</span>
                    </li>
                  ) : null}
                  {approvals.payroll_disputes ? (
                    <li className="flex justify-between py-2">
                      <Link href="/payroll" className="hover:underline">
                        Payroll disputes
                      </Link>
                      <span className="font-mono">{approvals.payroll_disputes}</span>
                    </li>
                  ) : null}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {w.me && (
          <Card>
            <CardHeader>
              <CardTitle>My leave balances</CardTitle>
            </CardHeader>
            <CardContent>
              {w.me.leave_balances.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No leave balances yet.</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {w.me.leave_balances.map((balance) => (
                    <li key={balance.leave_type} className="flex justify-between py-2">
                      <span>{balance.leave_type}</span>
                      <span className="font-mono">{balance.balance}</span>
                    </li>
                  ))}
                </ul>
              )}
              {w.me.payslip_awaiting_confirmation > 0 && (
                <Link
                  href="/payroll"
                  className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
                >
                  <WalletIcon className="size-4" />
                  {w.me.payslip_awaiting_confirmation} payslip
                  {w.me.payslip_awaiting_confirmation === 1 ? "" : "s"} awaiting your confirmation
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {w.payroll?.current_period && (
          <Card>
            <CardHeader>
              <CardTitle>Payroll — {w.payroll.current_period.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusChip tone="info">
                  {w.payroll.current_period.status.replace(/_/g, " ")}
                </StatusChip>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entries</span>
                <span className="font-mono">{w.payroll.current_period.entries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Awaiting confirmation</span>
                <span className="font-mono">{w.payroll.current_period.awaiting_confirmation}</span>
              </div>
              <Link href={`/payroll/${w.payroll.current_period.id}`} className="text-primary hover:underline">
                Open period →
              </Link>
            </CardContent>
          </Card>
        )}

        {w.upcoming_holidays && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming holidays</CardTitle>
              <CardDescription>The next few holidays on the calendar.</CardDescription>
            </CardHeader>
            <CardContent>
              {w.upcoming_holidays.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No upcoming holidays.{" "}
                  <Link href="/holidays" className="text-primary hover:underline">
                    Add one
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {w.upcoming_holidays.map((holiday) => (
                    <li key={`${holiday.title}-${holiday.date}`} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <p className="font-medium">{holiday.title}</p>
                        <p className="text-xs text-muted-foreground">{label(holiday.type)}</p>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{holiday.date}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {w.announcements && w.announcements.recent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {w.announcements.recent.map((announcement) => (
                  <li key={announcement.id} className="flex items-center justify-between py-2.5 text-sm">
                    <Link href="/announcements" className="font-medium hover:underline">
                      {announcement.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">{label(announcement.type)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {(w.me?.overtime_pending ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>My overtime</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/overtime" className="flex items-center gap-2 text-sm hover:underline">
                <AlarmClockIcon className="size-4" />
                {w.me?.overtime_pending} record{w.me?.overtime_pending === 1 ? "" : "s"} pending approval
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
