"use client";

import { useState } from "react";
import { AlertCircleIcon, CircleCheckIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { ApiError } from "@/lib/api-error";
import { useOrganizationSettings, useUpdateOrganizationSettings } from "@/services/settings";
import type { OrganizationSettingsData } from "@/types/settings";
import { WEEKDAYS } from "@/types/settings";

function Form({ initial }: { initial: OrganizationSettingsData }) {
  const update = useUpdateOrganizationSettings();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState({
    company_name: initial.company_name,
    timezone: initial.timezone,
    currency: initial.currency,
    currency_decimal_places: initial.currency_decimal_places,
    weekend_days: initial.weekend_days,
  });

  function toggleWeekendDay(day: string, checked: boolean) {
    setValues((current) => ({
      ...current,
      weekend_days: checked
        ? [...current.weekend_days, day]
        : current.weekend_days.filter((d) => d !== day),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    try {
      await update.mutateAsync(values);
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {saved && (
        <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/10">
          <CircleCheckIcon className="text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-300">Saved.</AlertDescription>
        </Alert>
      )}
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
            onChange={(e) => setValues((v) => ({ ...v, currency_decimal_places: Number(e.target.value) }))}
          />
        </FormField>
      </div>
      <FormField label="Weekend days">
        <div className="flex flex-wrap gap-4">
          {WEEKDAYS.map((day) => (
            <label key={day} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={values.weekend_days.includes(day)}
                onCheckedChange={(checked) => toggleWeekendDay(day, checked === true)}
              />
              {day[0].toUpperCase() + day.slice(1)}
            </label>
          ))}
        </div>
      </FormField>
      <Button type="submit" disabled={update.isPending}>
        Save organization settings
      </Button>
    </form>
  );
}

export function OrganizationSettingsTab() {
  const { data, isLoading } = useOrganizationSettings();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form initial={data} />;
}
