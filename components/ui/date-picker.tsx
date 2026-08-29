"use client";

import { useState } from "react";
import { format, isValid, parse, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TYPED_FORMATS = ["yyyy-MM-dd", "MMMM d, yyyy", "MMM d, yyyy", "M/d/yyyy"];

function parseTyped(text: string): Date | null {
  for (const formatString of TYPED_FORMATS) {
    const parsed = parse(text.trim(), formatString, new Date());
    if (isValid(parsed)) return parsed;
  }
  return null;
}

/**
 * Every date in this app travels as a "YYYY-MM-DD" string (§139.4) — this
 * wraps react-day-picker's Date-object API at the edge so nothing upstream
 * has to think about timezones or Date instances. Typable, not just
 * clickable: a real text input (accepting ISO or a few common written
 * formats) with the calendar as a second way in, not the only way in.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  id,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  id?: string;
}) {
  const selected = value ? parseISO(value) : undefined;
  const displayText = selected && isValid(selected) ? format(selected, "MMMM d, yyyy") : "";

  // "Adjusting state when a prop changes", without an effect (React docs):
  // resync the editable text from `value` only on the render where `value`
  // itself changed — e.g. a calendar pick, or the parent clearing the
  // field — never fighting the user's own keystrokes in between.
  const [text, setText] = useState(displayText);
  const [syncedFor, setSyncedFor] = useState(value);
  const [open, setOpen] = useState(false);

  if (value !== syncedFor) {
    setSyncedFor(value);
    setText(displayText);
  }

  function commitTyped() {
    if (text.trim() === "") {
      onChange(null);
      return;
    }

    const parsed = parseTyped(text);
    if (parsed) {
      onChange(format(parsed, "yyyy-MM-dd"));
    } else {
      // Invalid text: revert to the last known-good value rather than
      // silently keeping something unparseable in state.
      setText(selected && isValid(selected) ? format(selected, "MMMM d, yyyy") : "");
    }
  }

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
            <CalendarIcon className="size-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : null);
            setOpen(false);
          }}
          disabled={disabled}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
