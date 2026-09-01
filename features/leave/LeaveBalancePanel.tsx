"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLeaveBalances } from "@/services/leave";

const DOTS = [
  "bg-emerald-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-rose-500",
];

/**
 * The acting user's own leave balance, beside the requests table — one
 * block per leave type: days left as the headline, a usage bar, and the
 * taken / total underneath.
 */
export function LeaveBalancePanel() {
  const { data: balances, isLoading } = useLeaveBalances();
  const year = new Date().getFullYear();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base font-bold">Leave balance</CardTitle>
        <p className="text-xs text-muted-foreground">Days available in {year}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-1.5 w-full animate-pulse rounded-full bg-muted/70" />
              </div>
            ))}
          </div>
        ) : !balances || balances.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No leave types have been set up yet.
          </p>
        ) : (
          balances.map((balance, index) => {
            const dot = DOTS[index % DOTS.length];
            const pct =
              balance.entitlement > 0
                ? Math.min(100, Math.round((balance.taken / balance.entitlement) * 100))
                : 0;

            return (
              <div key={balance.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={cn("size-2 shrink-0 rounded-full", dot)} />
                    <span className="truncate text-sm font-medium text-foreground">
                      {balance.leave_type.name}
                    </span>
                  </span>
                  <span className="font-heading text-lg leading-none font-bold text-foreground tabular-nums">
                    {balance.balance}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    style={{ width: `${pct}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      dot,
                      balance.taken > 0 && "min-w-[6px]",
                    )}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
                  <span>{balance.taken} taken</span>
                  <span>of {balance.entitlement} days</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
