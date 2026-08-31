"use client";

import Link from "next/link";
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  FileCheckIcon,
  FileSpreadsheetIcon,
  MegaphoneIcon,
  PalmtreeIcon,
  SparklesIcon,
  WalletIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { MOCK_ANNOUNCEMENTS, MOCK_UPCOMING_HOLIDAYS } from "../mockData";

type Props = {
  onRequestLeave: () => void;
  onRequestAdjustment: () => void;
};

export function QuickActionsAndAnnouncements({ onRequestLeave, onRequestAdjustment }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 1. Quick Operations & Self-Service Shortcuts */}
      <Card className="border-border/70 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Self-Service Hub
          </CardTitle>
          <CardDescription>Instant actions & document requests</CardDescription>
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
                  Apply for Time-Off / Leave
                </p>
                <p className="text-[11px] text-muted-foreground">Casual, Medical or Earned</p>
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
                  Attendance Correction
                </p>
                <p className="text-[11px] text-muted-foreground">Fix missing check-in/out</p>
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
                  My Payslips & Tax
                </p>
                <p className="text-[11px] text-muted-foreground">Download latest payslip</p>
              </div>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </CardContent>
      </Card>

      {/* 2. Upcoming Holidays */}
      <Card className="border-border/70 bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="font-heading text-base font-bold text-foreground">
              Upcoming Holidays
            </CardTitle>
            <CardDescription>Official calendar holidays</CardDescription>
          </div>
          <Link href="/holidays" className="text-xs font-semibold text-primary hover:underline">
            Calendar
          </Link>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {MOCK_UPCOMING_HOLIDAYS.map((holiday) => {
            const dateObj = new Date(holiday.date);
            const monthStr = dateObj.toLocaleString("default", { month: "short" });
            const dayNum = dateObj.getDate();

            return (
              <div
                key={holiday.id}
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
                    <p className="text-[11px] text-muted-foreground">{holiday.dayName}</p>
                  </div>
                </div>
                <StatusChip tone="neutral">Public Holiday</StatusChip>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 3. Recent Announcements */}
      <Card className="border-border/70 bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="font-heading text-base font-bold text-foreground">
              Notice Board
            </CardTitle>
            <CardDescription>Company-wide updates & news</CardDescription>
          </div>
          <Link href="/announcements" className="text-xs font-semibold text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {MOCK_ANNOUNCEMENTS.map((ann) => (
            <Link
              key={ann.id}
              href="/announcements"
              className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 p-3 transition-all hover:border-primary/40 hover:bg-muted/40 group"
            >
              <div className="flex items-center justify-between">
                <StatusChip tone={ann.type === "URGENT" ? "danger" : "info"}>
                  {ann.tag}
                </StatusChip>
                <span className="text-[10px] font-medium text-muted-foreground">{ann.date}</span>
              </div>
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {ann.title}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
