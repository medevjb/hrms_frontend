"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-error";
import { useCreatePersonalEvent, useUpdatePersonalEvent } from "@/services/personal-events";
import type { PersonalEvent } from "@/types/personal-events";

const schema = z
  .object({
    title: z.string().min(1, "Title is required"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
  })
  .refine((value) => value.end_date >= value.start_date, {
    path: ["end_date"],
    message: "End date can't be before the start date",
  });

function initialValues(event?: PersonalEvent, initialRange?: { start: string; end: string } | null) {
  return event
    ? {
        title: event.title,
        start_date: event.start_date as string | null,
        end_date: event.end_date as string | null,
        description: event.description ?? "",
      }
    : {
        title: "",
        start_date: (initialRange?.start ?? null) as string | null,
        end_date: (initialRange?.end ?? initialRange?.start ?? null) as string | null,
        description: "",
      };
}

function PersonalEventForm({
  event,
  initialRange,
  onClose,
}: {
  event?: PersonalEvent;
  initialRange?: { start: string; end: string } | null;
  onClose: () => void;
}) {
  const isEdit = Boolean(event);
  const createEvent = useCreatePersonalEvent();
  const updateEvent = useUpdatePersonalEvent(event?.id ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState(() => initialValues(event, initialRange));

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = schema.safeParse({
      title: values.title,
      start_date: values.start_date ?? "",
      end_date: values.end_date ?? "",
    });
    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""]),
        ),
      );
      return;
    }

    const input = {
      title: values.title,
      start_date: values.start_date!,
      end_date: values.end_date!,
      description: values.description || null,
    };

    try {
      if (isEdit) {
        await updateEvent.mutateAsync(input);
      } else {
        await createEvent.mutateAsync(input);
      }
      onClose();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(caught.errors ?? {}).map(([field, messages]) => [field, messages[0]]),
          ),
        );
        setError(caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  const pending = createEvent.isPending || updateEvent.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit event" : "New personal event"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormField label="Title" htmlFor="event_title" error={fieldErrors.title}>
          <Input
            id="event_title"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Dentist appointment"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start date" htmlFor="event_start" error={fieldErrors.start_date}>
            <DatePicker
              id="event_start"
              value={values.start_date}
              onChange={(v) => {
                set("start_date", v);
                if (v && (!values.end_date || values.end_date < v)) set("end_date", v);
              }}
            />
          </FormField>
          <FormField label="End date" htmlFor="event_end" error={fieldErrors.end_date}>
            <DatePicker
              id="event_end"
              value={values.end_date}
              onChange={(v) => set("end_date", v)}
            />
          </FormField>
        </div>
        <FormField label="Note" htmlFor="event_description">
          <Textarea
            id="event_description"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </FormField>
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {isEdit ? "Save changes" : "Add event"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function SavePersonalEventModal({
  opened,
  onClose,
  event,
  initialRange,
}: {
  opened: boolean;
  onClose: () => void;
  event?: PersonalEvent;
  initialRange?: { start: string; end: string } | null;
}) {
  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {opened && (
          <PersonalEventForm
            key={event?.id ?? initialRange?.start ?? "new"}
            event={event}
            initialRange={initialRange}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
