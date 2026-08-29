"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { cn } from "@/lib/utils";
import { useHolidays } from "@/services/holidays";
import type { Holiday, HolidayType } from "@/types/holidays";
import { SaveHolidayModal } from "./SaveHolidayModal";

const TYPE_DOT: Record<HolidayType, string> = {
  NATIONAL: "bg-blue-500",
  RELIGIOUS: "bg-purple-500",
  COMPANY: "bg-teal-500",
  OTHER: "bg-gray-400",
};

const LEGEND: { type: HolidayType; label: string }[] = [
  { type: "NATIONAL", label: "National" },
  { type: "RELIGIOUS", label: "Religious" },
  { type: "COMPANY", label: "Company" },
  { type: "OTHER", label: "Other" },
];

export function HolidayCalendar() {
  const { data: holidays, isLoading } = useHolidays();
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<Holiday | undefined>(undefined);
  const [pickedDate, setPickedDate] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, Holiday>();
    for (const holiday of holidays ?? []) {
      map.set(holiday.date, holiday);
    }
    return map;
  }, [holidays]);

  function openForDate(date: Date) {
    const iso = format(date, "yyyy-MM-dd");
    const existing = byDate.get(iso);
    setEditing(existing);
    setPickedDate(iso);
    setOpened(true);
  }

  function close() {
    setOpened(false);
    setEditing(undefined);
    setPickedDate(null);
  }

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <Calendar
            numberOfMonths={1}
            className="mx-auto [--cell-size:3rem]"
            onDayClick={(date) => openForDate(date)}
            components={{
              DayButton: (props) => {
                const iso = format(props.day.date, "yyyy-MM-dd");
                const holiday = byDate.get(iso);

                return (
                  <div className="relative size-full">
                    <CalendarDayButton {...props} />
                    {holiday && (
                      <span
                        className={cn(
                          "pointer-events-none absolute bottom-1 left-1/2 size-2 -translate-x-1/2 rounded-full ring-2 ring-card",
                          TYPE_DOT[holiday.type],
                        )}
                      />
                    )}
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          {LEGEND.map((entry) => (
            <div key={entry.type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-full", TYPE_DOT[entry.type])} />
              {entry.label}
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditing(undefined);
            setPickedDate(null);
            setOpened(true);
          }}
        >
          <PlusIcon />
          Add holiday
        </Button>
      </div>

      <SaveHolidayModal opened={opened} onClose={close} holiday={editing} initialDate={pickedDate} />
    </div>
  );
}
