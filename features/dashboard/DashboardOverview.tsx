"use client";

import Link from "next/link";
import {
  AlarmClockIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  FileWarningIcon,
  MegaphoneIcon,
  UserCheckIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusChip } from "@/components/ui/status-chip";
import { TodayAttendanceCard } from "@/features/attendance/TodayAttendanceCard";
import { useDashboard } from "@/services/dashboard";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";

function label(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DashboardOverview() {
  const user = useCurrentUser();
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <PageLoadingSkeleton />;
  }

  const w = data.widgets;
  const approvals = w.pending_approvals ?? {};
  const totalApprovals = Object.values(approvals).reduce((sum, n) => sum + (n ?? 0), 0);

  // Attendance metrics calculation for breakdown gauge/bar
  const present = w.attendance_today?.present ?? 0;
  const late = w.attendance_today?.late ?? 0;
  const absent = w.attendance_today?.absent ?? 0;
  const totalToday = present + late + absent || 1;
  const presentPct = Math.round((present / totalToday) * 100);
  const latePct = Math.round((late / totalToday) * 100);
  const absentPct = Math.max(0, 100 - presentPct - latePct);

  return (
    <div className="space-y-6">
      {/* Top Greeting Banner */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Hello, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Here&apos;s what needs your attention today across the organization.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-xs md:self-auto">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>Organization Timezone: {user.organization.timezone}</span>
        </div>
      </div>

      {/* Attendance Check-in Hero Widget */}
      <TodayAttendanceCard />

      {/* Primary Workforce & Operations Stat Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {w.workforce && (
          <StatTile
            label="Total active workforce"
            value={w.workforce.total}
            icon={UsersIcon}
            tone="violet"
            subtext={`${w.workforce.departments} Depts • ${w.workforce.teams} Teams`}
          />
        )}
        {w.attendance_today && (
          <StatTile
            label="Today's attendance"
            value={`${w.attendance_today.present} Present`}
            icon={UserCheckIcon}
            tone="emerald"
            subtext={`${w.attendance_today.late} Late • ${w.attendance_today.absent} Absent`}
          />
        )}
        {w.pending_approvals && (
          <StatTile
            label="Waiting on you"
            value={totalApprovals}
            icon={FileWarningIcon}
            tone="amber"
            subtext={totalApprovals > 0 ? "Action items in queue" : "Queue is clear"}
          />
        )}
        {w.payroll && (
          <StatTile
            label="Open payroll periods"
            value={w.payroll.open_periods}
            icon={WalletIcon}
            tone="blue"
            subtext="Ready for processing"
          />
        )}
      </div>

      {/* Interactive Visual Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance Breakdown & Distribution Card */}
        {w.attendance_today && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold">Attendance Distribution</CardTitle>
                <CardDescription>Real-time attendance breakdown for today.</CardDescription>
              </div>
              <Link href="/attendance" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                View all <ChevronRightIcon className="size-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-5 pt-2">
              <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4 border border-border/50">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">Overall Attendance Rate</p>
                  <p className="font-mono text-3xl font-extrabold text-foreground">{presentPct}%</p>
                </div>
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    {present} Present
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 border border-amber-500/20">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    {late} Late
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-600 border border-rose-500/20">
                    <span className="size-1.5 rounded-full bg-rose-500" />
                    {absent} Absent
                  </span>
                </div>
              </div>

              {/* Segmented Progress Bar */}
              <div className="space-y-2">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    style={{ width: `${presentPct}%` }}
                    className="bg-emerald-500 transition-all duration-500"
                    title={`Present: ${presentPct}%`}
                  />
                  <div
                    style={{ width: `${latePct}%` }}
                    className="bg-amber-500 transition-all duration-500"
                    title={`Late: ${latePct}%`}
                  />
                  <div
                    style={{ width: `${absentPct}%` }}
                    className="bg-rose-500 transition-all duration-500"
                    title={`Absent: ${absentPct}%`}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waiting on you Approvals Queue */}
        {w.pending_approvals && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold">Waiting on you</CardTitle>
                <CardDescription>Approval requests queue.</CardDescription>
              </div>
              {totalApprovals > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-amber-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-600">
                  {totalApprovals}
                </span>
              )}
            </CardHeader>
            <CardContent>
              {totalApprovals === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
                    <UserCheckIcon className="size-5" />
                  </div>
                  <p className="text-sm font-semibold">Your queue is clear!</p>
                  <p className="text-xs text-muted-foreground">No pending approvals right now.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {approvals.leave ? (
                    <Link href="/leave" className="flex items-center justify-between py-3 group hover:bg-muted/40 px-1 rounded-lg transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7.5 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                          <CalendarClockIcon className="size-4" />
                        </div>
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          Leave approvals
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded-full">
                        {approvals.leave} <ChevronRightIcon className="size-3 text-muted-foreground" />
                      </span>
                    </Link>
                  ) : null}
                  {approvals.overtime ? (
                    <Link href="/overtime" className="flex items-center justify-between py-3 group hover:bg-muted/40 px-1 rounded-lg transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7.5 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                          <AlarmClockIcon className="size-4" />
                        </div>
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          Overtime approvals
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded-full">
                        {approvals.overtime} <ChevronRightIcon className="size-3 text-muted-foreground" />
                      </span>
                    </Link>
                  ) : null}
                  {approvals.holiday_notices ? (
                    <Link href="/holidays" className="flex items-center justify-between py-3 group hover:bg-muted/40 px-1 rounded-lg transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7.5 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                          <CalendarDaysIcon className="size-4" />
                        </div>
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          Holiday notices
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded-full">
                        {approvals.holiday_notices} <ChevronRightIcon className="size-3 text-muted-foreground" />
                      </span>
                    </Link>
                  ) : null}
                  {approvals.payroll_disputes ? (
                    <Link href="/payroll" className="flex items-center justify-between py-3 group hover:bg-muted/40 px-1 rounded-lg transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7.5 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                          <WalletIcon className="size-4" />
                        </div>
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          Payroll disputes
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded-full">
                        {approvals.payroll_disputes} <ChevronRightIcon className="size-3 text-muted-foreground" />
                      </span>
                    </Link>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Secondary Information Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* My Leave Balances */}
        {w.me && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold">My Leave Balances</CardTitle>
              <Link href="/leave" className="text-xs font-semibold text-primary hover:underline">
                Request leave
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {w.me.leave_balances.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No leave balances assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {w.me.leave_balances.map((balance) => (
                    <div key={balance.leave_type} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground">{balance.leave_type}</span>
                        <span className="font-mono text-primary">{balance.balance} days left</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          style={{ width: `${Math.min(100, (balance.balance / 20) * 100)}%` }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {w.me.payslip_awaiting_confirmation > 0 && (
                <Link
                  href="/payroll"
                  className="mt-4 flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs font-semibold text-amber-700 dark:text-amber-300 transition-colors hover:bg-amber-500/15"
                >
                  <div className="flex items-center gap-2">
                    <WalletIcon className="size-4 shrink-0 text-amber-600" />
                    <span>{w.me.payslip_awaiting_confirmation} payslip awaiting confirmation</span>
                  </div>
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Current Payroll Period Status */}
        {w.payroll?.current_period && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold">Payroll Period</CardTitle>
                <CardDescription>{w.payroll.current_period.label}</CardDescription>
              </div>
              <StatusChip tone="info">
                {w.payroll.current_period.status.replace(/_/g, " ")}
              </StatusChip>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Total Entries</p>
                  <p className="font-mono text-xl font-bold text-foreground">{w.payroll.current_period.entries}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Awaiting Conf.</p>
                  <p className="font-mono text-xl font-bold text-foreground">{w.payroll.current_period.awaiting_confirmation}</p>
                </div>
              </div>
              <Link
                href={`/payroll/${w.payroll.current_period.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                Open current period details <ArrowRightIcon className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Holidays */}
        {w.upcoming_holidays && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold">Upcoming Holidays</CardTitle>
                <CardDescription>Company calendar events.</CardDescription>
              </div>
              <Link href="/holidays" className="text-xs font-semibold text-primary hover:underline">
                Calendar
              </Link>
            </CardHeader>
            <CardContent>
              {w.upcoming_holidays.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No upcoming holidays scheduled.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {w.upcoming_holidays.map((holiday) => (
                    <div key={`${holiday.title}-${holiday.date}`} className="flex items-center justify-between rounded-xl border border-border/50 p-2.5 transition-colors hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 px-2 py-1 text-center font-mono">
                          <span className="text-[10px] font-bold uppercase text-primary">
                            {new Date(holiday.date).toLocaleString("default", { month: "short" })}
                          </span>
                          <span className="text-xs font-extrabold text-foreground">
                            {new Date(holiday.date).getDate()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{holiday.title}</p>
                          <p className="text-[10px] text-muted-foreground">{label(holiday.type)}</p>
                        </div>
                      </div>
                      <StatusChip tone="neutral">{holiday.date}</StatusChip>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Announcements */}
        {w.announcements && w.announcements.recent.length > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold">Recent Announcements</CardTitle>
                <CardDescription>Company-wide updates and notices.</CardDescription>
              </div>
              <Link href="/announcements" className="text-xs font-semibold text-primary hover:underline">
                View all announcements
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {w.announcements.recent.map((announcement) => (
                  <Link
                    key={announcement.id}
                    href="/announcements"
                    className="flex flex-col justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 transition-all hover:border-primary/40 hover:bg-muted/40 hover:shadow-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <StatusChip tone={announcement.type === "URGENT" ? "danger" : "info"}>
                          {label(announcement.type)}
                        </StatusChip>
                        <MegaphoneIcon className="size-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-xs font-bold text-foreground line-clamp-2">{announcement.title}</p>
                    </div>
                    <p className="mt-3 text-[10px] font-medium text-muted-foreground">Click to read announcement</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

