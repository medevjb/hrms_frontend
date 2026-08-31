"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarDaysIcon,
  CoffeeIcon,
  HourglassIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  dateFormatted: string;
  isWorkDay: boolean;
  nonWorkReason: string | null;
  shiftStart: string | null;
  shiftEnd: string | null;
  graceEnd: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  checkInActual: string | null;
  checkOutActual: string | null;
};

function Step({
  icon: Icon,
  tone,
  time,
  label,
  done,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  time: string;
  label: string;
  done: boolean;
}) {
  return (
    <div className="relative flex items-center gap-3.5">
      <div
        className={`relative z-1 flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-card ${tone} ${
          done ? "" : "opacity-60"
        }`}
      >
        <Icon className="size-3.5 stroke-[2.5]" />
      </div>
      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        <span className="font-mono text-xs font-bold text-foreground">{time}</span>
        <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
      </div>
    </div>
  );
}

export function TodayScheduleCard({
  dateFormatted,
  isWorkDay,
  nonWorkReason,
  shiftStart,
  shiftEnd,
  graceEnd,
  breakStart,
  breakEnd,
  checkInActual,
  checkOutActual,
}: Props) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card p-4 sm:p-5 shadow-xs">
      <CardHeader className="p-0 pb-4">
        <div>
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Today&apos;s schedule
          </CardTitle>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <CalendarDaysIcon className="size-3.5 text-primary" /> {dateFormatted}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!isWorkDay ? (
          <p className="rounded-xl bg-muted/40 p-4 text-center text-xs text-muted-foreground">
            {nonWorkReason ?? "Not a working day."}
          </p>
        ) : !shiftStart || !shiftEnd ? (
          <p className="rounded-xl bg-muted/40 p-4 text-center text-xs text-muted-foreground">
            No shift is assigned for today.
          </p>
        ) : (
          <div className="relative space-y-5">
            <div className="absolute left-[13px] top-3 bottom-3 w-[2px] bg-border/80" />

            <Step
              icon={ArrowUpIcon}
              tone="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              time={checkInActual ?? shiftStart}
              label={checkInActual ? "Checked in" : "Shift starts"}
              done={Boolean(checkInActual)}
            />

            {graceEnd && !checkInActual && (
              <Step
                icon={HourglassIcon}
                tone="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                time={graceEnd}
                label="Check-in grace ends"
                done={false}
              />
            )}

            {breakStart && breakEnd && (
              <Step
                icon={CoffeeIcon}
                tone="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                time={`${breakStart} – ${breakEnd}`}
                label="Break"
                done={false}
              />
            )}

            <Step
              icon={ArrowDownIcon}
              tone="bg-rose-500/15 text-rose-600 dark:text-rose-400"
              time={checkOutActual ?? shiftEnd}
              label={checkOutActual ? "Checked out" : "Shift ends"}
              done={Boolean(checkOutActual)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
