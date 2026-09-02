import Link from "next/link";
import { Building2Icon, UsersRoundIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardWorkforce } from "@/types/dashboard";
import { HeadcountByDepartmentChart } from "./HeadcountByDepartmentChart";

function titleCase(value: string): string {
  return value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function WorkforcePanel({ workforce }: { workforce: DashboardWorkforce }) {
  const statuses = Object.entries(workforce.by_status).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="border-border/70 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-heading text-base font-bold text-foreground">Workforce</CardTitle>
        <Link href="/employees" className="text-xs font-semibold text-primary hover:underline">
          All employees
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="font-mono text-3xl font-bold text-foreground">{workforce.total}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <UsersRoundIcon className="size-3.5" /> people
            </p>
          </div>
          <div>
            <p className="font-mono text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {workforce.active}
            </p>
            <p className="text-xs text-muted-foreground">active</p>
          </div>
        </div>

        {statuses.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {statuses.map(([status, count]) => (
              <span
                key={status}
                className="rounded-lg bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {titleCase(status)} · {count}
              </span>
            ))}
          </div>
        )}

        {workforce.by_department.length > 0 && (
          <div className="space-y-2 border-t border-border/50 pt-3">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <Building2Icon className="size-3" /> By department
            </p>
            <HeadcountByDepartmentChart workforce={workforce} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
