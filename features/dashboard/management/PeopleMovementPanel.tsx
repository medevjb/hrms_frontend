import { LogInIcon, LogOutIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardPeopleMovement } from "@/types/dashboard";

function titleCase(value: string): string {
  return value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function PeopleMovementPanel({ movement }: { movement: DashboardPeopleMovement }) {
  const nothing = movement.recent_joiners.length === 0 && movement.recent_exits.length === 0;

  return (
    <Card className="border-border/70 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base font-bold text-foreground">
          People movement
        </CardTitle>
        <p className="text-xs text-muted-foreground">Last 30 days</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {nothing ? (
          <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
            No joiners or exits in the last month.
          </p>
        ) : (
          <>
            {movement.recent_joiners.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <LogInIcon className="size-3" /> Joined
                </p>
                {movement.recent_joiners.map((person) => (
                  <div key={person.employee_id} className="flex items-center justify-between text-xs">
                    <span className="truncate text-foreground">{person.name}</span>
                    <span className="text-muted-foreground">
                      {person.designation} · {person.joining_date}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {movement.recent_exits.length > 0 && (
              <div className="space-y-1.5 border-t border-border/50 pt-3">
                <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  <LogOutIcon className="size-3" /> Left
                </p>
                {movement.recent_exits.map((person) => (
                  <div key={person.employee_id} className="flex items-center justify-between text-xs">
                    <span className="truncate text-foreground">{person.name}</span>
                    <span className="text-muted-foreground">{titleCase(person.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
