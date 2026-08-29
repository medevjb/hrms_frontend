"use client";

import Link from "next/link";
import {
  Building2Icon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
} from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { TodayAttendanceCard } from "@/features/attendance/TodayAttendanceCard";
import { useDepartments } from "@/services/departments";
import { useEmployees } from "@/services/employees";
import { useHolidays } from "@/services/holidays";
import { useShifts } from "@/services/shifts";
import { useTeams } from "@/services/teams";
import type { EmployeeStatus } from "@/types/organization";

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  INVITED: "Invited",
  ACTIVE: "Active",
  PROBATION: "Probation",
  NOTICE_PERIOD: "Notice period",
  SUSPENDED: "Suspended",
  RESIGNED: "Resigned",
  TERMINATED: "Terminated",
  ARCHIVED: "Archived",
};

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  INVITED: "var(--color-invited)",
  ACTIVE: "var(--color-active)",
  PROBATION: "var(--color-probation)",
  NOTICE_PERIOD: "var(--color-notice)",
  SUSPENDED: "var(--color-suspended)",
  RESIGNED: "var(--color-notice)",
  TERMINATED: "var(--color-suspended)",
  ARCHIVED: "var(--color-invited)",
};

const chartConfig = {
  count: { label: "Employees" },
  active: { label: "Active", color: "oklch(0.72 0.17 165)" },
  invited: { label: "Invited / Archived", color: "oklch(0.75 0.01 270)" },
  probation: { label: "Probation", color: "oklch(0.78 0.16 85)" },
  notice: { label: "Notice / Resigned", color: "oklch(0.7 0.17 60)" },
  suspended: { label: "Suspended / Terminated", color: "oklch(0.62 0.22 25)" },
} satisfies ChartConfig;

export function DashboardOverview() {
  // A generous per_page rather than a dedicated aggregate endpoint — real
  // counts from real data, no fabricated numbers; revisit with a proper
  // stats endpoint if the roster outgrows one page (docs/PRD.md Phase 10).
  const { data: employeePage, isLoading: loadingEmployees } = useEmployees({ per_page: 100 });
  const { data: departments, isLoading: loadingDepartments } = useDepartments();
  const { data: teams, isLoading: loadingTeams } = useTeams();
  const { data: shifts, isLoading: loadingShifts } = useShifts();
  const { data: holidays, isLoading: loadingHolidays } = useHolidays();

  const loading = loadingEmployees || loadingDepartments || loadingTeams || loadingShifts || loadingHolidays;

  if (loading) {
    return <PageLoadingSkeleton />;
  }

  const employees = employeePage?.data ?? [];
  const totalEmployees = employeePage?.meta.total ?? employees.length;
  const activeShifts = (shifts ?? []).filter((shift) => shift.active).length;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingHolidays = (holidays ?? [])
    .filter((holiday) => holiday.active && holiday.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const statusCounts = employees.reduce<Record<string, number>>((acc, employee) => {
    acc[employee.status] = (acc[employee.status] ?? 0) + 1;
    return acc;
  }, {});

  const chartData = (Object.keys(STATUS_LABELS) as EmployeeStatus[])
    .filter((status) => statusCounts[status] > 0)
    .map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: statusCounts[status],
      fill: STATUS_COLORS[status],
    }));

  return (
    <>
      <PageHeader
        title="Overview"
        description="A live snapshot of the organization. Role-aware dashboards land in Phase 10 (docs/PRD.md §73-§78)."
      />

      <TodayAttendanceCard />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total employees" value={totalEmployees} icon={UsersIcon} tone="violet" />
        <StatTile
          label="Departments / teams"
          value={`${departments?.length ?? 0} / ${teams?.length ?? 0}`}
          icon={Building2Icon}
          tone="blue"
        />
        <StatTile label="Active shifts" value={activeShifts} icon={ClockIcon} tone="emerald" />
        <StatTile
          label="Upcoming holidays"
          value={upcomingHolidays.length}
          icon={CalendarDaysIcon}
          tone="amber"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Employee status</CardTitle>
            <CardDescription>
              {totalEmployees > employees.length
                ? `Breakdown of the first ${employees.length} employees`
                : "Breakdown of every employee"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No employees yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-64">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
                  <Pie data={chartData} dataKey="count" nameKey="label" innerRadius={55} outerRadius={85} strokeWidth={2}>
                    {chartData.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
              {chartData.map((entry) => (
                <div key={entry.status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                  {entry.label} ({entry.count})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Upcoming holidays</CardTitle>
            <CardDescription>The next five holidays on the calendar.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingHolidays.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No upcoming holidays.{" "}
                <Link href="/holidays" className="text-primary hover:underline">
                  Add one
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {upcomingHolidays.map((holiday) => (
                  <li key={holiday.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{holiday.title}</p>
                      <p className="text-xs text-muted-foreground">{holiday.type}</p>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{holiday.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
