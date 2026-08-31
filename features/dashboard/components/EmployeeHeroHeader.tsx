"use client";

import {
  CalendarDaysIcon,
  FileSpreadsheetIcon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  userName: string;
  designation?: string;
  employeeCode?: string;
  onRequestLeave: () => void;
  onRequestAdjustment: () => void;
};

export function EmployeeHeroHeader({
  userName,
  designation = "Senior Software Engineer",
  employeeCode = "EMP-1042",
  onRequestLeave,
  onRequestAdjustment,
}: Props) {
  const displayDate = "11 May, Monday";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-1">
      {/* Left: Clean, low-profile greeting matching reference image */}
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground">
          Welcome back,
        </p>
        <h1 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-1.5">
          {userName} <span className="inline-block">👋</span>
        </h1>
        <div className="flex items-center gap-2 pt-0.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground/80 flex items-center gap-1">
            <CalendarDaysIcon className="size-3 text-primary" />
            {displayDate}
          </span>
          <span className="text-border">•</span>
          <span className="font-mono text-[11px] text-muted-foreground font-medium">{employeeCode}</span>
          <span className="text-border">•</span>
          <span className="text-[11px] text-muted-foreground truncate">{designation}</span>
        </div>
      </div>

      {/* Right: Compact Action Buttons */}
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button
          size="sm"
          onClick={onRequestLeave}
          className="h-8 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
        >
          <PlusIcon className="mr-1 size-3.5" />
          Request Leave
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onRequestAdjustment}
          className="h-8 rounded-xl border-border/70 bg-card px-3 text-xs font-semibold shadow-xs hover:border-primary/40 hover:bg-muted"
        >
          <FileSpreadsheetIcon className="mr-1 size-3.5 text-muted-foreground" />
          Attendance Correction
        </Button>
      </div>
    </div>
  );
}
