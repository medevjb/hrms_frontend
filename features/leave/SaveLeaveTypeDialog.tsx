"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-error";
import { useCreateLeaveType, useUpdateLeaveType, type SaveLeaveTypeInput } from "@/services/leave";
import type { LeaveType } from "@/types/leave";

function initialValues(leaveType?: LeaveType): SaveLeaveTypeInput {
  return leaveType
    ? {
        name: leaveType.name,
        code: leaveType.code,
        annual_allocation_days: leaveType.annual_allocation_days,
        is_paid: leaveType.is_paid,
        supports_half_day: leaveType.supports_half_day,
        carry_forward_enabled: leaveType.carry_forward_enabled,
        carry_forward_cap_days: leaveType.carry_forward_cap_days,
        requires_document: leaveType.requires_document,
        max_consecutive_days: leaveType.max_consecutive_days,
        min_employment_days: leaveType.min_employment_days,
        accrual_mode: leaveType.accrual_mode,
        is_active: leaveType.is_active,
      }
    : {
        name: "",
        code: "",
        annual_allocation_days: 15,
        is_paid: true,
        supports_half_day: true,
        carry_forward_enabled: false,
        carry_forward_cap_days: null,
        requires_document: false,
        max_consecutive_days: null,
        min_employment_days: null,
        accrual_mode: "UPFRONT",
        is_active: true,
      };
}

function Form({ leaveType, onClose }: { leaveType?: LeaveType; onClose: () => void }) {
  const isEdit = Boolean(leaveType);
  const createLeaveType = useCreateLeaveType();
  const updateLeaveType = useUpdateLeaveType(leaveType?.id ?? 0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<SaveLeaveTypeInput>(() => initialValues(leaveType));

  function set<K extends keyof SaveLeaveTypeInput>(key: K, value: SaveLeaveTypeInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    try {
      if (isEdit) {
        await updateLeaveType.mutateAsync(values);
        toast.success("Leave type updated");
      } else {
        await createLeaveType.mutateAsync(values);
        toast.success("Leave type created");
      }
      onClose();
    } catch (caught) {
      // The failure toast is fired by the global mutation handler; here we
      // only fan the server's field errors out under their inputs.
      if (caught instanceof ApiError) {
        setFieldErrors(Object.fromEntries(Object.entries(caught.errors ?? {}).map(([f, m]) => [f, m[0]])));
      }
    }
  }

  const pending = createLeaveType.isPending || updateLeaveType.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit leave type" : "New leave type"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" htmlFor="leave_type_name" error={fieldErrors.name}>
            <Input id="leave_type_name" value={values.name} onChange={(e) => set("name", e.target.value)} />
          </FormField>
          <FormField label="Code" htmlFor="leave_type_code" error={fieldErrors.code} description="Stable, unique">
            <Input id="leave_type_code" value={values.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />
          </FormField>
        </div>
        <FormField
          label="Annual allocation (days)"
          htmlFor="leave_type_allocation"
          error={fieldErrors.annual_allocation_days}
        >
          <Input
            id="leave_type_allocation"
            type="number"
            min={0}
            step={0.5}
            value={values.annual_allocation_days}
            onChange={(e) => set("annual_allocation_days", Number(e.target.value))}
          />
        </FormField>
        <FormField label="Accrual mode" error={fieldErrors.accrual_mode}>
          <Select value={values.accrual_mode} onValueChange={(v) => set("accrual_mode", v as "UPFRONT" | "MONTHLY")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UPFRONT">Upfront — full allocation on leave-year start</SelectItem>
              <SelectItem value="MONTHLY">Monthly — 1/12 credited each month</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Max consecutive days"
            htmlFor="leave_type_max_consecutive"
            description="Blank for no limit"
          >
            <Input
              id="leave_type_max_consecutive"
              type="number"
              min={1}
              value={values.max_consecutive_days ?? ""}
              onChange={(e) => set("max_consecutive_days", e.target.value === "" ? null : Number(e.target.value))}
            />
          </FormField>
          <FormField
            label="Minimum employment (days)"
            htmlFor="leave_type_min_employment"
            description="Before it's usable"
          >
            <Input
              id="leave_type_min_employment"
              type="number"
              min={0}
              value={values.min_employment_days ?? ""}
              onChange={(e) => set("min_employment_days", e.target.value === "" ? null : Number(e.target.value))}
            />
          </FormField>
        </div>
        {values.carry_forward_enabled && (
          <FormField
            label="Carry-forward cap (days)"
            htmlFor="leave_type_carry_cap"
            description="Blank uses the organization default"
          >
            <Input
              id="leave_type_carry_cap"
              type="number"
              min={0}
              step={0.5}
              value={values.carry_forward_cap_days ?? ""}
              onChange={(e) => set("carry_forward_cap_days", e.target.value === "" ? null : Number(e.target.value))}
            />
          </FormField>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Switch id="leave_type_paid" checked={values.is_paid} onCheckedChange={(v) => set("is_paid", v)} />
            <label htmlFor="leave_type_paid" className="text-sm font-medium">Paid</label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="leave_type_half_day"
              checked={values.supports_half_day}
              onCheckedChange={(v) => set("supports_half_day", v)}
            />
            <label htmlFor="leave_type_half_day" className="text-sm font-medium">Supports half-day</label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="leave_type_carry_forward"
              checked={values.carry_forward_enabled}
              onCheckedChange={(v) => set("carry_forward_enabled", v)}
            />
            <label htmlFor="leave_type_carry_forward" className="text-sm font-medium">Carry forward</label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="leave_type_requires_document"
              checked={values.requires_document}
              onCheckedChange={(v) => set("requires_document", v)}
            />
            <label htmlFor="leave_type_requires_document" className="text-sm font-medium">Requires document</label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="leave_type_active" checked={values.is_active} onCheckedChange={(v) => set("is_active", v)} />
            <label htmlFor="leave_type_active" className="text-sm font-medium">Active</label>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {isEdit ? "Save changes" : "Create leave type"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function SaveLeaveTypeDialog({
  opened,
  onClose,
  leaveType,
}: {
  opened: boolean;
  onClose: () => void;
  leaveType?: LeaveType;
}) {
  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {opened && <Form key={leaveType?.id ?? "new"} leaveType={leaveType} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
