"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-error";
import { useLeaveTypes, useSubmitLeaveRequest } from "@/services/leave";
import type { HalfDayPeriod } from "@/types/leave";

function Form({ onClose }: { onClose: () => void }) {
  const { data: leaveTypes } = useLeaveTypes();
  const submit = useSubmitLeaveRequest();

  const [leaveTypeId, setLeaveTypeId] = useState<string>("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<HalfDayPeriod>("FIRST_HALF");
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedType = leaveTypes?.find((t) => String(t.id) === leaveTypeId);
  const activeTypes = leaveTypes?.filter((t) => t.is_active) ?? [];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    if (!leaveTypeId || !startDate) return;

    try {
      await submit.mutateAsync({
        leave_type_id: Number(leaveTypeId),
        start_date: startDate,
        end_date: isHalfDay ? startDate : (endDate ?? startDate),
        is_half_day: isHalfDay,
        half_day_period: isHalfDay ? halfDayPeriod : undefined,
        reason: reason || null,
      });
      toast.success("Leave request submitted");
      onClose();
    } catch (caught) {
      // The failure toast is fired by the global mutation handler; here we
      // only fan the server's field errors out under their inputs.
      if (caught instanceof ApiError) {
        setFieldErrors(Object.fromEntries(Object.entries(caught.errors ?? {}).map(([f, m]) => [f, m[0]])));
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Leave type" error={fieldErrors.leave_type_id}>
        <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a leave type" />
          </SelectTrigger>
          <SelectContent>
            {activeTypes.map((type) => (
              <SelectItem key={type.id} value={String(type.id)}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {selectedType?.supports_half_day && (
        <div className="flex items-center gap-2">
          <Switch id="leave_request_half_day" checked={isHalfDay} onCheckedChange={setIsHalfDay} />
          <label htmlFor="leave_request_half_day" className="text-sm font-medium">
            Half-day request
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Start date" htmlFor="leave_request_start" error={fieldErrors.start_date}>
          <DatePicker id="leave_request_start" value={startDate} onChange={setStartDate} />
        </FormField>
        {!isHalfDay && (
          <FormField label="End date" htmlFor="leave_request_end" error={fieldErrors.end_date}>
            <DatePicker id="leave_request_end" value={endDate} onChange={setEndDate} />
          </FormField>
        )}
      </div>

      {isHalfDay && (
        <FormField label="Which half">
          <Select value={halfDayPeriod} onValueChange={(v) => setHalfDayPeriod(v as HalfDayPeriod)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIRST_HALF">First half of the day</SelectItem>
              <SelectItem value="SECOND_HALF">Second half of the day</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      )}

      <FormField label="Reason" htmlFor="leave_request_reason" description="Optional">
        <Textarea id="leave_request_reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </FormField>

      <DialogFooter>
        <Button type="submit" disabled={submit.isPending || !leaveTypeId || !startDate}>
          Submit request
        </Button>
      </DialogFooter>
    </form>
  );
}

export function SubmitLeaveRequestDialog({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request leave</DialogTitle>
        </DialogHeader>
        {opened && <Form key="submit-leave" onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
