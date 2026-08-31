"use client";

import Link from "next/link";
import {
  ChevronRightIcon,
  FileSpreadsheetIcon,
  PalmtreeIcon,
  WalletIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import type { DashboardPayload } from "@/types/dashboard";

type Props = {
  holidays: NonNullable<DashboardPayload["widgets"]["upcoming_holidays"]> | undefined;
  announcements: DashboardPayload["widgets"]["announcements"] | undefined;
  onRequestLeave: () => void;
  onRequestAdjustment: () => void;
};

export function QuickActionsAndAnnouncements({
  holidays,
  announcements,
  onRequestLeave,
  onRequestAdjustment,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 1. Self-service shortcuts */}
      <Card className="border-border/70 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Self-service
          </CardTitle>
          <CardDescription>Common requests, one tap away</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <button
            type="button"
            onClick={onRequestLeave}
            className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3 text-left transition-all hover:border-primary/40 hover:bg-muted/50 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PalmtreeIcon className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  Request leave
                </p>
                <p className="text-[11px] text-muted-foreground">Casual, medical or earned</p>
              </div>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onRequestAdjustment}
            className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3 text-left transition-all hover:border-primary/40 hover:bg-muted/50 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <FileSpreadsheetIcon className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  Attendance correction
                </p>
                <p className="text-[11px] text-muted-foreground">Fix a missing check-in or out</p>
              </div>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>

          <Link
            href="/payroll"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3 text-left transition-all hover:border-primary/40 hover:bg-muted/50 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <WalletIcon className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  My payslips
                </p>
                <p className="text-[11px] text-muted-foreground">Download your latest payslip</p>
              </div>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </CardContent>
      </Card>

      {/* 2. Upcoming holidays */}
      <Card className="border-border/70 bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="font-heading text-base font-bold text-foreground">
              Upcoming holidays
            </CardTitle>
            <CardDescription>From the official calendar</CardDescription>
          </div>
          <Link href="/holidays" className="text-xs font-semibold text-primary hover:underline">
            Calendar
          </Link>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {!holidays || holidays.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
              No holidays coming up.
            </p>
          ) : (
            holidays.map((holiday) => {
              const dateObj = new Date(holiday.date);
              const monthStr = dateObj.toLocaleString(undefined, { month: "short" });
              const dayNum = dateObj.getUTCDate();
              const dayName = dateObj.toLocaleString(undefined, { weekday: "long" });

              return (
                <div
                  key={`${holiday.date}-${holiday.title}`}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-2.5 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 px-2 py-1 text-center font-mono">
                      <span className="text-[10px] font-bold uppercase text-primary leading-tight">
                        {monthStr}
                      </span>
                      <span className="text-xs font-extrabold text-foreground leading-tight">
                        {dayNum}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{holiday.title}</p>
                      <p className="text-[11px] text-muted-foreground">{dayName}</p>
                    </div>
                  </div>
                  <StatusChip tone="neutral">{holiday.type.replace(/_/g, " ")}</StatusChip>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 3. Notice board */}
      <Card className="border-border/70 bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="font-heading text-base font-bold text-foreground">
              Notice board
            </CardTitle>
            <CardDescription>
              {announcements && announcements.unread > 0
                ? `${announcements.unread} unread`
                : "Company-wide updates"}
            </CardDescription>
          </div>
          <Link href="/announcements" className="text-xs font-semibold text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {!announcements || announcements.recent.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
              Nothing posted yet.
            </p>
          ) : (
            announcements.recent.map((ann) => (
              <Link
                key={ann.id}
                href="/announcements"
                className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 p-3 transition-all hover:border-primary/40 hover:bg-muted/40 group"
              >
                <div className="flex items-center justify-between">
                  <StatusChip tone={ann.type === "URGENT" ? "danger" : "info"}>
                    {ann.type.replace(/_/g, " ")}
                  </StatusChip>
                  {ann.published_at && (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {new Date(ann.published_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {ann.title}
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
