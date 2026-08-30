"use client";

import { useState } from "react";
import { format, formatISO, isValid, parse, parseISO, set } from "date-fns";
import { CalendarClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TYPED_FORMATS = [
  "yyyy-MM-dd HH:mm",
  "yyyy-MM-dd'T'HH:mm",
  "MMM d, yyyy h:mm a",
  "MMM d, yyyy HH:mm",
  "M/d/yyyy h:mm a",
  "M/d/yyyy HH:mm",
];

const DISPLAY = "MMM d, yyyy 'at' h:mm a";

function parseTyped(text: string): Date | null {
  for (const formatString of TYPED_FORMATS) {
    const parsed = parse(text.trim(), formatString, new Date());
    if (isValid(parsed)) return parsed;
  }
  const iso = parseISO(text.trim());
  return isValid(iso) ? iso : null;
}

/**
 * The date-and-time counterpart to DatePicker. Same shape — a typable text
 * input with a popover as the second way in — but the value carries a time,
 * so it travels as a full ISO-8601 timestamp with offset (§139.4), e.g.
 * "2026-08-20T09:07:00+06:00". Built on react-day-picker + a native time
 * field; no extra date library.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date & time",
  disabled,
  id,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  id?: string;
}) {
  const parsed = value ? parseISO(value) : undefined;
  const current = parsed && isValid(parsed) ? parsed : undefined;
  const displayText = current ? format(current, DISPLAY) : "";
  const timeText = current ? format(current, "HH:mm") : "";

  // Resync the editable text from `value` only on the render where `value`
  // itself changed (React docs, "adjusting state when a prop changes") —
  // never mid-keystroke. Mirrors DatePicker.
  const [text, setText] = useState(displayText);
  const [syncedFor, setSyncedFor] = useState(value);
  const [open, setOpen] = useState(false);

  if (value !== syncedFor) {
    setSyncedFor(value);
    setText(displayText);
  }

  function emit(date: Date) {
    onChange(formatISO(set(date, { seconds: 0, milliseconds: 0 })));
  }

  function commitTyped() {
    if (text.trim() === "") {
      onChange(null);
      return;
    }
    const typed = parseTyped(text);
    if (typed) emit(typed);
    else setText(current ? format(current, DISPLAY) : "");
  }

  function handleDaySelect(day: Date | undefined) {
    if (!day) {
      onChange(null);
      return;
    }
    const base = current ?? new Date();
    emit(set(day, { hours: base.getHours(), minutes: base.getMinutes() }));
  }

  function handleTimeChange(next: string) {
    const [hours, minutes] = next.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return;
    emit(set(current ?? new Date(), { hours, minutes }));
  }

  const timeInputId = id ? `${id}-time` : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <Input
          id={id}
          value={text}
          placeholder={placeholder}
          onChange={(event) => setText(event.target.value)}
          onBlur={commitTyped}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitTyped();
            }
          }}
          className="pr-9"
        />
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute inset-y-0 right-0.5 my-auto text-muted-foreground"
            aria-label="Open calendar"
          >
            <CalendarClockIcon className="size-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={current}
          onSelect={handleDaySelect}
          disabled={disabled}
          autoFocus
        />
        <div className="flex items-center gap-3 border-t border-border p-3">
          <label htmlFor={timeInputId} className="text-sm font-medium">
            Time
          </label>
          <Input
            id={timeInputId}
            type="time"
            value={timeText}
            onChange={(event) => handleTimeChange(event.target.value)}
            className="w-auto flex-1"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
