"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { MonthCalendar, type CalendarChip } from "@/features/calendar/MonthCalendar";
import { datesInRange } from "@/features/calendar/utils";
import { useReportingPeriod } from "@/hooks/use-reporting-period";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { PERSONAL_EVENT_CHIP, PERSONAL_EVENT_DOT } from "@/features/personal-events/constants";
import { SavePersonalEventModal } from "@/features/personal-events/SavePersonalEventModal";
import { cn } from "@/lib/utils";
import { useHolidays } from "@/services/holidays";
import { usePersonalEvents } from "@/services/personal-events";
import type { Holiday } from "@/types/holidays";
import type { PersonalEvent } from "@/types/personal-events";
import { HOLIDAY_TYPE_CHIP, HOLIDAY_TYPE_DOT, HOLIDAY_TYPE_LEGEND } from "./constants";
import { SaveHolidayModal } from "./SaveHolidayModal";

export function HolidayCalendar() {
  const user = useCurrentUser();
  const canManage = user.permissions.includes("holiday.manage");

  const { data: holidays, isLoading } = useHolidays();
  const { data: personalEvents } = usePersonalEvents();

  const { period, isCurrent, goPrev, goNext, goToCurrent } = useReportingPeriod();

  const [holidayOpen, setHolidayOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | undefined>(undefined);
  const [pickedDate, setPickedDate] = useState<string | null>(null);

  const [eventOpen, setEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PersonalEvent | undefined>(undefined);

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, Holiday[]>();
    for (const holiday of holidays ?? []) {
      const list = map.get(holiday.date) ?? [];
      list.push(holiday);
      map.set(holiday.date, list);
    }
    return map;
  }, [holidays]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PersonalEvent[]>();
    for (const event of personalEvents ?? []) {
      for (const iso of datesInRange(event.start_date, event.end_date)) {
        const list = map.get(iso) ?? [];
        list.push(event);
        map.set(iso, list);
      }
    }
    return map;
  }, [personalEvents]);

  function editHoliday(holiday: Holiday) {
    if (!canManage) return;
    setEditingHoliday(holiday);
    setPickedDate(holiday.date);
    setHolidayOpen(true);
  }

  function addHoliday(iso: string) {
    if (!canManage) return;
    setEditingHoliday(undefined);
    setPickedDate(iso);
    setHolidayOpen(true);
  }

  function closeHoliday() {
    setHolidayOpen(false);
    setEditingHoliday(undefined);
    setPickedDate(null);
  }

  function chipsForDate(iso: string): CalendarChip[] {
    const holidayChips: CalendarChip[] = (holidaysByDate.get(iso) ?? []).map((holiday) => ({
      key: `h-${holiday.id}`,
      label: holiday.title,
      className: HOLIDAY_TYPE_CHIP[holiday.type],
      dotClassName: HOLIDAY_TYPE_DOT[holiday.type],
      muted: !holiday.active,
      onClick: canManage ? () => editHoliday(holiday) : undefined,
    }));

    const eventChips: CalendarChip[] = (eventsByDate.get(iso) ?? []).map((event) => ({
      key: `e-${event.id}`,
      label: event.title,
      className: PERSONAL_EVENT_CHIP,
      dotClassName: PERSONAL_EVENT_DOT,
      onClick: () => {
        setEditingEvent(event);
        setEventOpen(true);
      },
    }));

    return [...holidayChips, ...eventChips];
  }

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <MonthCalendar
          period={period}
          isCurrentPeriod={isCurrent}
          onPrevPeriod={goPrev}
          onNextPeriod={goNext}
          onJumpToCurrent={goToCurrent}
          chipsForDate={chipsForDate}
          onDayClick={canManage ? addHoliday : undefined}
          actions={
            canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => addHoliday(format(new Date(), "yyyy-MM-dd"))}
              >
                <PlusIcon />
                Add holiday
              </Button>
            )
          }
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {HOLIDAY_TYPE_LEGEND.map((entry) => (
            <div
              key={entry.type}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className={cn("size-2 rounded-full", HOLIDAY_TYPE_DOT[entry.type])} />
              {entry.label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("size-2 rounded-full", PERSONAL_EVENT_DOT)} />
            My events
          </div>
          {!canManage && <span className="text-xs text-muted-foreground">· Holidays are view only</span>}
        </div>
      </CardContent>

      <SaveHolidayModal
        opened={holidayOpen}
        onClose={closeHoliday}
        holiday={editingHoliday}
        initialDate={pickedDate}
      />
      <SavePersonalEventModal
        opened={eventOpen}
        onClose={() => {
          setEventOpen(false);
          setEditingEvent(undefined);
        }}
        event={editingEvent}
      />
    </Card>
  );
}
