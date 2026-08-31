import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import type { DashboardPayroll } from "@/types/dashboard";

function titleCase(value: string): string {
  return value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function PayrollPanel({ payroll }: { payroll: DashboardPayroll }) {
  const period = payroll.current_period;

  return (
    <Card className="border-border/70 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-heading text-base font-bold text-foreground">Payroll</CardTitle>
        <Link href="/payroll" className="text-xs font-semibold text-primary hover:underline">
          Open payroll
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {period ? (
          <Link
            href={`/payroll/${period.id}`}
            className="block rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{period.label}</span>
              <StatusChip tone="info">{titleCase(period.status)}</StatusChip>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {period.entries} entries · {period.awaiting_confirmation} awaiting confirmation
            </p>
          </Link>
        ) : (
          <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
            No payroll period has been started.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {payroll.open_periods} open {payroll.open_periods === 1 ? "period" : "periods"}
        </p>
      </CardContent>
    </Card>
  );
}
