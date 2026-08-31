"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeaveBalanceItem } from "../mockData";

type Props = {
  balances: LeaveBalanceItem[];
  onRequestLeave: () => void;
};

export function LeaveBalanceCard({ balances, onRequestLeave }: Props) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card p-4 sm:p-5 shadow-xs">
      <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Leave Balance
          </CardTitle>
          <p className="text-xs text-muted-foreground">Allocation for Year 2026</p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onRequestLeave}
          className="h-7 rounded-xl border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold px-2.5 shadow-xs"
        >
          <PlusIcon className="mr-1 size-3" />
          Request Leave
        </Button>
      </CardHeader>

      <CardContent className="p-0 space-y-3 pt-1">
        {/* Table Column Headers matching image */}
        <div className="grid grid-cols-12 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
          <div className="col-span-6">Type</div>
          <div className="col-span-3 text-right">Taken</div>
          <div className="col-span-3 text-right">Remaining</div>
        </div>

        {/* List of Leave Types with sleek progress bars */}
        <div className="space-y-2.5">
          {balances.map((item) => {
            const pct = item.total > 0 ? Math.min(100, Math.round((item.taken / item.total) * 100)) : 0;

            return (
              <div
                key={item.id}
                className="group rounded-xl p-2 transition-colors hover:bg-muted/30 space-y-1.5"
              >
                <div className="grid grid-cols-12 items-center text-xs">
                  {/* Type name with colored dot */}
                  <div className="col-span-6 flex items-center gap-2 min-w-0">
                    <span className={`size-2 shrink-0 rounded-full ${item.color}`} />
                    <span className="font-semibold text-foreground truncate">{item.type}</span>
                  </div>

                  {/* Taken */}
                  <div className="col-span-3 text-right font-mono text-xs font-bold text-muted-foreground">
                    {item.taken}
                  </div>

                  {/* Remaining */}
                  <div className="col-span-3 text-right font-mono text-xs font-extrabold text-foreground">
                    {item.remaining}
                  </div>
                </div>

                {/* Sleek slim progress bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/70">
                  <div
                    style={{ width: `${Math.max(8, 100 - pct)}%` }}
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
