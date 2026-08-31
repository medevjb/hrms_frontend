"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardLeaveBalance } from "@/types/dashboard";

type Props = {
  balances: DashboardLeaveBalance[] | undefined;
  isLoading: boolean;
  onRequestLeave: () => void;
};

const DOTS = ["bg-emerald-500", "bg-indigo-500", "bg-violet-500", "bg-amber-500", "bg-sky-500"];

export function LeaveBalanceCard({ balances, isLoading, onRequestLeave }: Props) {
  const year = new Date().getFullYear();

  return (
    <Card className="rounded-2xl border-border/70 bg-card p-4 sm:p-5 shadow-xs">
      <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Leave balance
          </CardTitle>
          <p className="text-xs text-muted-foreground">Allocation for {year}</p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onRequestLeave}
          className="h-7 rounded-xl border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold px-2.5 shadow-xs"
        >
          <PlusIcon className="mr-1 size-3" />
          Request leave
        </Button>
      </CardHeader>

      <CardContent className="p-0 space-y-3 pt-1">
        {isLoading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : !balances || balances.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
            No leave balances have been set up for you yet.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-12 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
              <div className="col-span-6">Type</div>
              <div className="col-span-3 text-right">Taken</div>
              <div className="col-span-3 text-right">Remaining</div>
            </div>

            <div className="space-y-2.5">
              {balances.map((item, idx) => {
                const dot = DOTS[idx % DOTS.length];
                const pct =
                  item.entitlement > 0
                    ? Math.min(100, Math.round((item.taken / item.entitlement) * 100))
                    : 0;

                return (
                  <div
                    key={item.leave_type}
                    className="group rounded-xl p-2 transition-colors hover:bg-muted/30 space-y-1.5"
                  >
                    <div className="grid grid-cols-12 items-center text-xs">
                      <div className="col-span-6 flex items-center gap-2 min-w-0">
                        <span className={`size-2 shrink-0 rounded-full ${dot}`} />
                        <span className="font-semibold text-foreground truncate">
                          {item.leave_type}
                        </span>
                      </div>
                      <div className="col-span-3 text-right font-mono text-xs font-bold text-muted-foreground">
                        {item.taken}
                      </div>
                      <div className="col-span-3 text-right font-mono text-xs font-extrabold text-foreground">
                        {item.balance}
                      </div>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/70">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full ${dot} rounded-full transition-all duration-500`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
