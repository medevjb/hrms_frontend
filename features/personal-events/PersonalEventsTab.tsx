"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarPlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { cn } from "@/lib/utils";
import { useDeletePersonalEvent, usePersonalEvents } from "@/services/personal-events";
import type { PersonalEvent } from "@/types/personal-events";
import { MonthCalendar, type CalendarChip } from "@/features/calendar/MonthCalendar";
import { datesInRange } from "@/features/calendar/utils";
import { PERSONAL_EVENT_CHIP, PERSONAL_EVENT_DOT } from "./constants";
import { SavePersonalEventModal } from "./SavePersonalEventModal";

function formatSpan(event: PersonalEvent) {
  const start = parseISO(event.start_date);
  if (event.start_date === event.end_date) {
    return format(start, "EEE, d MMM yyyy");
  }
  const end = parseISO(event.end_date);
  return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
}

export function PersonalEventsTab() {
  const { data: events, isLoading } = usePersonalEvents();
  const deleteEvent = useDeletePersonalEvent();

  const [month, setMonth] = useState<Date>(() => new Date());
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<PersonalEvent | undefined>(undefined);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PersonalEvent | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, PersonalEvent[]>();
    for (const event of events ?? []) {
      for (const iso of datesInRange(event.start_date, event.end_date)) {
        const list = map.get(iso) ?? [];
        list.push(event);
        map.set(iso, list);
      }
    }
    return map;
  }, [events]);

  const upcoming = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return (events ?? [])
      .filter((event) => event.end_date >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, [events]);

  function openNew(start: string, end?: string) {
    setEditing(undefined);
    setRange({ start, end: end ?? start });
    setOpened(true);
  }

  function openEdit(event: PersonalEvent) {
    setEditing(event);
    setRange(null);
    setOpened(true);
  }

  function close() {
    setOpened(false);
    setEditing(undefined);
    setRange(null);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteEvent.mutate(pendingDelete.id, {
      onSuccess: () => toast.success("Event removed"),
      onError: () => toast.error("Couldn't remove the event"),
      onSettled: () => setPendingDelete(null),
    });
  }

  function chipsForDate(iso: string): CalendarChip[] {
    return (byDate.get(iso) ?? []).map((event) => ({
      key: event.id,
      label: event.title,
      className: PERSONAL_EVENT_CHIP,
      dotClassName: PERSONAL_EVENT_DOT,
      onClick: () => openEdit(event),
    }));
  }

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            chipsForDate={chipsForDate}
            onDayClick={(iso) => openNew(iso)}
            actions={
              <Button variant="outline" size="sm" onClick={() => openNew(format(new Date(), "yyyy-MM-dd"))}>
                <CalendarPlusIcon />
                New event
              </Button>
            }
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Only you can see these. They don&rsquo;t affect attendance, leave, or anyone else&rsquo;s calendar.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <h3 className="font-heading text-sm font-semibold text-foreground">Upcoming events</h3>
          {upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming events"
              description="Click a day on the calendar to add a reminder for yourself."
            />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((event) => (
                <li key={event.id} className="flex items-start gap-3 py-3">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", PERSONAL_EVENT_DOT)} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">{event.title}</div>
                    <div className="text-xs text-muted-foreground">{formatSpan(event)}</div>
                    {event.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(event)}
                      aria-label="Edit event"
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPendingDelete(event)}
                      aria-label="Delete event"
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <SavePersonalEventModal opened={opened} onClose={close} event={editing} initialRange={range} />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &ldquo;{pendingDelete?.title}&rdquo; from your calendar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
