"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormStatus } from "@/components/ui/FormStatus";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-error";
import { useOrganizationSettings, useUpdateOrganizationSettings } from "@/services/settings";
import type { OrganizationSettingsData, Weekday } from "@/types/settings";
import { WEEKDAYS } from "@/types/settings";

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Form({ initial }: { initial: OrganizationSettingsData }) {
  const router = useRouter();
  const update = useUpdateOrganizationSettings();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState({
    company_name: initial.company_name,
    timezone: initial.timezone,
    currency: initial.currency,
    currency_decimal_places: initial.currency_decimal_places,
    default_weekend_day: initial.default_weekend_day,
    reporting_month_cutoff_day: initial.reporting_month_cutoff_day,
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    try {
      await update.mutateAsync(values);
      setSaved(true);
      // timezone / reporting-month ride on the SSR session payload
      // (`user.organization`); re-run the layout so every open surface
      // picks up the new boundaries without a hard reload.
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormStatus error={error} saved={saved} />

      <FormField label="Company name" htmlFor="company_name">
        <Input
          id="company_name"
          value={values.company_name}
          onChange={(e) => setValues((v) => ({ ...v, company_name: e.target.value }))}
        />
      </FormField>
      <FormField
        label="Timezone"
        htmlFor="timezone"
        description="IANA timezone, e.g. Asia/Dhaka — authoritative for attendance"
      >
        <Input
          id="timezone"
          value={values.timezone}
          onChange={(e) => setValues((v) => ({ ...v, timezone: e.target.value }))}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Currency" htmlFor="currency" description="3-letter ISO code">
          <Input
            id="currency"
            value={values.currency}
            onChange={(e) => setValues((v) => ({ ...v, currency: e.target.value }))}
          />
        </FormField>
        <FormField label="Currency decimal places" htmlFor="currency_decimal_places">
          <Input
            id="currency_decimal_places"
            type="number"
            min={0}
            max={4}
            value={values.currency_decimal_places}
            onChange={(e) =>
              setValues((v) => ({ ...v, currency_decimal_places: Number(e.target.value) }))
            }
          />
        </FormField>
      </div>
      <FormField
        label="Weekly off day"
        htmlFor="default_weekend_day"
        description="The default rest day for everyone. Set a different day per person under Weekly offs."
      >
        <Select
          value={values.default_weekend_day}
          onValueChange={(day) =>
            setValues((v) => ({ ...v, default_weekend_day: day as Weekday }))
          }
        >
          <SelectTrigger id="default_weekend_day" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEEKDAYS.map((day) => (
              <SelectItem key={day} value={day}>
                {titleCase(day)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField
        label="Reporting month cut-off day"
        htmlFor="reporting_month_cutoff_day"
        description="Day 1–28, or blank for standard calendar months. Set to 25 and the reporting month runs from the 26th of one month to the 25th of the next, named after the month it ends in. Applies everywhere — every calendar, dashboard, report, and the payroll period."
      >
        <Input
          id="reporting_month_cutoff_day"
          type="number"
          min={1}
          max={28}
          className="w-56"
          value={values.reporting_month_cutoff_day ?? ""}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              reporting_month_cutoff_day: e.target.value === "" ? null : Number(e.target.value),
            }))
          }
        />
      </FormField>
      <p className="text-xs text-muted-foreground">
        Current reporting month:{" "}
        <span className="font-medium text-foreground">{initial.reporting_period.label}</span> (
        {initial.reporting_period.start_date} → {initial.reporting_period.end_date})
      </p>
      <Button type="submit" disabled={update.isPending}>
        {update.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

export function OrganizationSettingsTab() {
  const { data, isLoading } = useOrganizationSettings();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form initial={data} />;
}
