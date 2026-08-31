"use client";

import { useState, useMemo } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addMonths, subMonths, format } from "date-fns";
import { generateMonthCalendarDays } from "../utils";
import type { CalendarDayItem } from "../mockData";
import { DayDetailsModal } from "./DayDetailsModal";

type Props = {
  backendAttendanceRecords?: Array<{
    work_date: string;
    status: string;
    check_in: string | null;
    check_out: string | null;
    worked_minutes: number | null;
    late_minutes: number | null;
    shift?: { name: string } | null;
  }>;
  holidays?: Array<{ date: string; title: string }>;
  onRequestCorrection: (day: CalendarDayItem) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function AttendanceCalendarCard({
  backendAttendanceRecords,
  holidays,
  onRequestCorrection,
}: Props) {
  // Current date & month as initial state
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());
  
  // Track selected date key on grid
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));

  // Track inspected day for modal (starts as null)
  const [inspectedDay, setInspectedDay] = useState<CalendarDayItem | null>(null);

  const { days, stats } = useMemo(() => {
    return generateMonthCalendarDays(currentMonthDate, backendAttendanceRecords, holidays);
  }, [currentMonthDate, backendAttendanceRecords, holidays]);

  const handlePrevMonth = () => setCurrentMonthDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonthDate((prev) => addMonths(prev, 1));
  const handleSelectMonth = (monthIndex: number) => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), monthIndex, 1));
  };
  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentMonthDate(now);
    setSelectedDateKey(format(now, "yyyy-MM-dd"));
  };

  const handleDayClick = (item: CalendarDayItem) => {
    setSelectedDateKey(item.date);
    setInspectedDay(item);
  };

  return (
    <Card className="rounded-3xl border-border/70 bg-card p-5 sm:p-6 shadow-xs">
      {/* Top Header matching reference image */}
      <CardHeader className="p-0 pb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Title + Month selector */}
          <div className="space-y-1">
            <CardTitle className="font-heading text-lg font-bold text-foreground">
              Attendance Calendar
            </CardTitle>

            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-1 text-sm font-bold text-foreground hover:text-primary transition-colors focus:outline-none">
                  <span>{format(currentMonthDate, "MMMM yyyy")}</span>
                  <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto rounded-2xl p-1.5 shadow-xl">
                  {MONTH_NAMES.map((name, idx) => (
                    <DropdownMenuItem
                      key={name}
                      className="cursor-pointer text-xs font-semibold rounded-xl py-1.5"
                      onClick={() => handleSelectMonth(idx)}
                    >
                      {name} {currentMonthDate.getFullYear()}
                    </DropdownMenuItem>
                  ))}
                  <div className="border-t border-border/50 my-1" />
                  <DropdownMenuItem
                    className="cursor-pointer text-xs font-bold text-primary rounded-xl"
                    onClick={handleJumpToToday}
                  >
                    Current Month (Today)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Prev / Next buttons */}
              <button
                type="button"
                onClick={handlePrevMonth}
                className="inline-flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Previous Month"
              >
                <ChevronLeftIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="inline-flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Next Month"
              >
                <ChevronRightIcon className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Status Legend with colored vertical bars matching reference image */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-start sm:self-auto">
            {/* Working Days */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-[3px] rounded-full bg-blue-600" />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-extrabold text-foreground leading-none">
                  {stats.workingDays}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                  Working Days
                </span>
              </div>
            </div>

            {/* Present */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-[3px] rounded-full bg-emerald-500" />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-extrabold text-foreground leading-none">
                  {stats.present}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                  Present
                </span>
              </div>
            </div>

            {/* Late */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-[3px] rounded-full bg-amber-500" />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-extrabold text-foreground leading-none">
                  {stats.late}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                  Late
                </span>
              </div>
            </div>

            {/* Movement */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-[3px] rounded-full bg-purple-500" />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-extrabold text-foreground leading-none">
                  {stats.movement}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                  Movement
                </span>
              </div>
            </div>

            {/* Leave */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-[3px] rounded-full bg-indigo-500" />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-extrabold text-foreground leading-none">
                  {stats.leave}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                  Leave
                </span>
              </div>
            </div>

            {/* Red bar indicator */}
            <div className="h-6 w-[3px] rounded-full bg-rose-500 hidden sm:block" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {/* Calendar Structure */}
        <div className="space-y-2">
          {/* Weekday Row Header with soft pill background */}
          <div className="grid grid-cols-7 rounded-2xl bg-muted/40 dark:bg-muted/20 py-2.5 text-center text-xs font-semibold text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Calendar Grid Days with max-width: 72px and height: 53px */}
          <div className="grid grid-cols-7 gap-y-2 sm:gap-y-3 gap-x-1 sm:gap-x-2 pt-1">
            {days.map((item, idx) => {
              if (!item.isCurrentMonth) {
                // Render empty blank cell outside month boundaries as in reference image
                return <div key={`empty-${idx}`} className="max-w-[72px] h-[53px] w-full mx-auto" />;
              }

              const isSelected = selectedDateKey === item.date;
              const isAbsent = item.status === "ABSENT";
              const isLate = item.status === "LATE";
              const isPresent = item.status === "PRESENT";
              const isOff = item.status === "OFF";
              const isHoliday = item.status === "HOLIDAY";
              const isLeave = item.status === "LEAVE";

              // Button gets background tint only for Late, Absent, Leave
              let buttonBg = "hover:bg-muted/40";
              if (isAbsent) {
                buttonBg = "bg-rose-500/[0.06] dark:bg-rose-500/10 hover:bg-rose-500/10";
              } else if (isLate) {
                buttonBg = "bg-amber-500/[0.07] dark:bg-amber-500/10 hover:bg-amber-500/15";
              } else if (isLeave) {
                buttonBg = "bg-purple-500/[0.06] dark:bg-purple-500/10 hover:bg-purple-500/10";
              }

              return (
                <button
                  key={`${item.date}-${idx}`}
                  type="button"
                  onClick={() => handleDayClick(item)}
                  className={`group relative flex max-w-[72px] h-[53px] w-full mx-auto flex-col items-center justify-center rounded-[12px] p-1 transition-all duration-150 focus:outline-none ${buttonBg} ${
                    isSelected ? "border-2 border-primary" : "border-2 border-transparent"
                  }`}
                >
                  {/* Day Number */}
                  <span
                    className={`font-heading text-xs font-bold ${
                      item.isToday
                        ? "text-primary underline decoration-2 underline-offset-4"
                        : isAbsent
                        ? "text-rose-600 dark:text-rose-400"
                        : isLate
                        ? "text-amber-600 dark:text-amber-400"
                        : isLeave
                        ? "text-purple-600 dark:text-purple-400"
                        : isOff
                        ? "text-muted-foreground/80"
                        : "text-foreground"
                    }`}
                  >
                    {item.day}
                  </span>

                  {/* Status label under day number */}
                  <div className="mt-0.5 flex flex-col items-center justify-center min-h-[16px]">
                    {isPresent && (
                      <span className="inline-flex items-center justify-center rounded-md bg-emerald-500/15 dark:bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Present
                      </span>
                    )}

                    {isOff && (
                      <span className="text-[10px] font-bold text-muted-foreground/80">
                        (Off)
                      </span>
                    )}

                    {isAbsent && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        Absent
                      </span>
                    )}

                    {isLate && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        Late
                      </span>
                    )}

                    {isHoliday && (
                      <span className="inline-flex items-center justify-center rounded-md bg-blue-500/15 dark:bg-blue-500/20 px-1.5 py-0.2 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        Holiday
                      </span>
                    )}

                    {isLeave && (
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        Leave
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>

      {/* Day Details Modal */}
      <DayDetailsModal
        day={inspectedDay}
        isOpen={Boolean(inspectedDay)}
        onClose={() => setInspectedDay(null)}
        onRequestCorrection={(day) => {
          setInspectedDay(null);
          onRequestCorrection(day);
        }}
      />
    </Card>
  );
}
