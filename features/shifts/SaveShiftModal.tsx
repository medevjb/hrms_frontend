"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api-error";
import { useCreateShift, useUpdateShift } from "@/services/shifts";
import type { Shift } from "@/types/shifts";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  expected_work_minutes: z.number().min(1, "Must be at least 1 minute"),
});

function initialValues(shift?: Shift) {
  return shift
    ? {
        name: shift.name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        expected_work_minutes: shift.expected_work_minutes,
        break_minutes: shift.break_minutes,
        break_start: shift.break_start ?? "",
        break_end: shift.break_end ?? "",
        late_grace_minutes: shift.late_grace_minutes?.toString() ?? "",
        active: shift.active,
      }
    : {
        name: "",
        start_time: "",
        end_time: "",
        expected_work_minutes: 480,
        break_minutes: 60,
        break_start: "",
        break_end: "",
        late_grace_minutes: "",
        active: true,
      };
}

/** Minutes between two "HH:MM" times, or null if either is missing/invalid. */
function breakWindowMinutes(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : null;
}

function ShiftForm({ shift, onClose }: { shift?: Shift; onClose: () => void }) {
  const isEdit = Boolean(shift);
  const createShift = useCreateShift();
  const updateShift = useUpdateShift(shift?.id ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState(() => initialValues(shift));

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""]),
        ),
      );
      return;
    }

    const input = {
      name: values.name,
      start_time: values.start_time,
      end_time: values.end_time,
      expected_work_minutes: values.expected_work_minutes,
      break_minutes: breakWindowMinutes(values.break_start, values.break_end) ?? values.break_minutes,
      break_start: values.break_start === "" ? null : values.break_start,
      break_end: values.break_end === "" ? null : values.break_end,
      late_grace_minutes: values.late_grace_minutes === "" ? null : Number(values.late_grace_minutes),
      active: values.active,
    };

    try {
      if (isEdit) {
        await updateShift.mutateAsync(input);
      } else {
        await createShift.mutateAsync(input);
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

  const pending = createShift.isPending || updateShift.isPending;
  const windowMinutes = breakWindowMinutes(values.break_start, values.break_end);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit shift" : "New shift"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormField label="Name" htmlFor="shift_name" error={fieldErrors.name}>
          <Input id="shift_name" value={values.name} onChange={(e) => set("name", e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start time" htmlFor="start_time" error={fieldErrors.start_time}>
            <Input
              id="start_time"
              type="time"
              value={values.start_time}
              onChange={(e) => set("start_time", e.target.value)}
            />
          </FormField>
          <FormField label="End time" htmlFor="end_time" error={fieldErrors.end_time}>
            <Input
              id="end_time"
              type="time"
              value={values.end_time}
              onChange={(e) => set("end_time", e.target.value)}
            />
          </FormField>
        </div>
        <FormField
          label="Expected work minutes"
          htmlFor="expected_work_minutes"
          error={fieldErrors.expected_work_minutes}
        >
          <Input
            id="expected_work_minutes"
            type="number"
            min={1}
            value={values.expected_work_minutes}
            onChange={(e) => set("expected_work_minutes", Number(e.target.value))}
          />
        </FormField>
        <div className="rounded-xl border border-border/70 p-3 space-y-3">
          <p className="text-sm font-medium text-foreground">
            Break time
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {windowMinutes !== null
                ? `${windowMinutes} min`
                : "Set a start and end so it shows on the schedule"}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Break start time" htmlFor="break_start" error={fieldErrors.break_start}>
              <Input
                id="break_start"
                type="time"
                value={values.break_start}
                onChange={(e) => set("break_start", e.target.value)}
              />
            </FormField>
            <FormField label="Break end time" htmlFor="break_end" error={fieldErrors.break_end}>
              <Input
                id="break_end"
                type="time"
                value={values.break_end}
                onChange={(e) => set("break_end", e.target.value)}
              />
            </FormField>
          </div>
        </div>
        <FormField
          label="Late grace minutes (shift-specific override)"
          htmlFor="late_grace_minutes"
          description="Leave blank to use the organization default"
        >
          <Input
            id="late_grace_minutes"
            type="number"
            min={0}
            value={values.late_grace_minutes}
            onChange={(e) => set("late_grace_minutes", e.target.value)}
          />
        </FormField>
        <div className="flex items-center gap-2">
          <Switch id="active" checked={values.active} onCheckedChange={(v) => set("active", v)} />
          <label htmlFor="active" className="text-sm font-medium">
            Active
          </label>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {isEdit ? "Save changes" : "Create shift"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function SaveShiftModal({
  opened,
  onClose,
  shift,
}: {
  opened: boolean;
  onClose: () => void;
  shift?: Shift;
}) {
  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {opened && <ShiftForm key={shift?.id ?? "new"} shift={shift} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
