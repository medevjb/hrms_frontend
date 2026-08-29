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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-error";
import { useCreateHoliday, useUpdateHoliday } from "@/services/holidays";
import type { Holiday, HolidayType } from "@/types/holidays";

const HOLIDAY_TYPES: { value: HolidayType; label: string }[] = [
  { value: "NATIONAL", label: "National" },
  { value: "RELIGIOUS", label: "Religious" },
  { value: "COMPANY", label: "Company" },
  { value: "OTHER", label: "Other" },
];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["NATIONAL", "RELIGIOUS", "COMPANY", "OTHER"]),
});

function initialValues(holiday?: Holiday, initialDate?: string | null) {
  return holiday
    ? {
        title: holiday.title,
        date: holiday.date as string | null,
        type: holiday.type,
        description: holiday.description ?? "",
        office_location: holiday.office_location ?? "",
        active: holiday.active,
      }
    : {
        title: "",
        date: (initialDate ?? null) as string | null,
        type: "COMPANY" as HolidayType,
        description: "",
        office_location: "",
        active: true,
      };
}

function HolidayForm({
  holiday,
  initialDate,
  onClose,
}: {
  holiday?: Holiday;
  initialDate?: string | null;
  onClose: () => void;
}) {
  const isEdit = Boolean(holiday);
  const createHoliday = useCreateHoliday();
  const updateHoliday = useUpdateHoliday(holiday?.id ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState(() => initialValues(holiday, initialDate));

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = schema.safeParse({ ...values, date: values.date ?? "" });
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
      date: values.date!,
      type: values.type,
      description: values.description || null,
      office_location: values.office_location || null,
      active: values.active,
    };

    try {
      if (isEdit) {
        await updateHoliday.mutateAsync(input);
      } else {
        await createHoliday.mutateAsync(input);
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

  const pending = createHoliday.isPending || updateHoliday.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit holiday" : "New holiday"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormField label="Title" htmlFor="holiday_title" error={fieldErrors.title}>
          <Input id="holiday_title" value={values.title} onChange={(e) => set("title", e.target.value)} />
        </FormField>
        <FormField label="Date" htmlFor="holiday_date" error={fieldErrors.date}>
          <DatePicker id="holiday_date" value={values.date} onChange={(v) => set("date", v)} />
        </FormField>
        <FormField label="Type" error={fieldErrors.type}>
          <Select value={values.type} onValueChange={(v) => set("type", v as HolidayType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOLIDAY_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Description" htmlFor="holiday_description">
          <Textarea
            id="holiday_description"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </FormField>
        <FormField label="Office location" htmlFor="holiday_office_location">
          <Input
            id="holiday_office_location"
            value={values.office_location}
            onChange={(e) => set("office_location", e.target.value)}
          />
        </FormField>
        <div className="flex items-center gap-2">
          <Switch id="holiday_active" checked={values.active} onCheckedChange={(v) => set("active", v)} />
          <label htmlFor="holiday_active" className="text-sm font-medium">
            Active
          </label>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {isEdit ? "Save changes" : "Create holiday"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function SaveHolidayModal({
  opened,
  onClose,
  holiday,
  initialDate,
}: {
  opened: boolean;
  onClose: () => void;
  holiday?: Holiday;
  initialDate?: string | null;
}) {
  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {opened && (
          <HolidayForm
            key={holiday?.id ?? initialDate ?? "new"}
            holiday={holiday}
            initialDate={initialDate}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
