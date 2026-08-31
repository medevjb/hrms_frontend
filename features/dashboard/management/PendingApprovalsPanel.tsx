import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardPendingApprovals } from "@/types/dashboard";

// docs/PRD.md — each queue links to the screen where the caller acts on it.
const QUEUES: Array<{ key: keyof DashboardPendingApprovals; label: string; href: string }> = [
  { key: "leave", label: "Leave requests", href: "/leave" },
  { key: "overtime", label: "Overtime requests", href: "/overtime" },
  { key: "holiday_notices", label: "Holiday notices", href: "/holidays" },
  { key: "payroll_disputes", label: "Payroll disputes", href: "/payroll" },
];

export function PendingApprovalsPanel({ approvals }: { approvals: DashboardPendingApprovals }) {
  const rows = QUEUES.filter((queue) => approvals[queue.key] !== undefined);

  return (
    <Card className="border-border/70 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base font-bold text-foreground">
          Waiting on you
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((queue) => {
          const count = approvals[queue.key] ?? 0;
          return (
            <Link
              key={queue.key}
              href={queue.href}
              className="group flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3 transition-all hover:border-primary/40 hover:bg-muted/50"
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex size-8 items-center justify-center rounded-lg font-mono text-sm font-bold ${
                    count > 0
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
                <span className="text-xs font-semibold text-foreground">{queue.label}</span>
              </span>
              <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
