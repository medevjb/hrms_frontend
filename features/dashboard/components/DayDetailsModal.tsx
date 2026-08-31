"use client";

import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileEditIcon,
  InfoIcon,
  MapPinIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import type { CalendarDayItem, CalendarDayStatus } from "../mockData";

type Props = {
  day: CalendarDayItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestCorrection: (day: CalendarDayItem) => void;
};

const STATUS_MAP: Record<CalendarDayStatus, { label: string; tone: StatusTone }> = {
  PRESENT: { label: "Present", tone: "success" },
  LATE: { label: "Late", tone: "warning" },
  ABSENT: { label: "Absent", tone: "danger" },
  OFF: { label: "Weekend (Off)", tone: "neutral" },
  HOLIDAY: { label: "Holiday", tone: "info" },
  LEAVE: { label: "Approved Leave", tone: "info" },
  MOVEMENT: { label: "Movement / Duty", tone: "info" },
  HALF_DAY: { label: "Half Day", tone: "warning" },
  FUTURE: { label: "Scheduled", tone: "neutral" },
};

export function DayDetailsModal({ day, isOpen, onClose, onRequestCorrection }: Props) {
  if (!day) return null;

  const statusConfig = STATUS_MAP[day.status] || { label: day.status, tone: "neutral" };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDaysIcon className="size-4" />
              </div>
              <DialogTitle className="text-lg font-bold">Attendance Record</DialogTitle>
            </div>
            <StatusChip tone={statusConfig.tone}>{statusConfig.label}</StatusChip>
          </div>
          <DialogDescription className="text-xs font-medium text-muted-foreground">
            {day.date} • {day.isToday ? "Today" : "Day " + day.day}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Shift info box */}
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Shift Schedule</span>
              <span className="font-mono text-muted-foreground">09:00 AM - 06:00 PM</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {day.shiftName || "General Morning Shift (Standard 9 Hours)"}
            </p>
          </div>

          {/* Punch details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/70 bg-card p-3 space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <ClockIcon className="size-3 text-emerald-500" /> Check-In
              </p>
              <p className="font-mono text-sm font-bold text-foreground">
                {day.checkIn || "—"}
              </p>
              {day.status === "LATE" && (
                <span className="inline-block text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Late by 22 mins
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-3 space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <ClockIcon className="size-3 text-rose-500" /> Check-Out
              </p>
              <p className="font-mono text-sm font-bold text-foreground">
                {day.checkOut || "—"}
              </p>
              {day.workedHours && (
                <span className="inline-block text-[10px] font-medium text-muted-foreground">
                  Worked: {day.workedHours}
                </span>
              )}
            </div>
          </div>

          {/* Notes / Special remarks */}
          {day.note && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-primary/5 border border-primary/20 p-3 text-xs">
              <InfoIcon className="size-4 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Notice / Note</p>
                <p className="text-muted-foreground text-[11px]">{day.note}</p>
              </div>
            </div>
          )}

          {day.status === "OFF" && (
            <div className="rounded-2xl bg-muted/40 p-3 text-center text-xs text-muted-foreground">
              Official weekend rest day according to the organization roster.
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          {day.status !== "OFF" && day.status !== "HOLIDAY" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onRequestCorrection(day);
              }}
              className="w-full sm:w-auto rounded-xl border-border/70 text-xs font-semibold"
            >
              <FileEditIcon className="mr-1.5 size-3.5" />
              Request Correction
            </Button>
          )}
          <Button
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl text-xs font-semibold"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
