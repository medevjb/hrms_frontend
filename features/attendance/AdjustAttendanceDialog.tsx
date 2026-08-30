"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-error";
import { useAdjustAttendance } from "@/services/attendance";
import type { AttendanceRecord, AttendanceStatus } from "@/types/attendance";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "PRESENT", label: "Present" },
  { value: "LATE", label: "Late" },
  { value: "ABSENT", label: "Absent" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "WEEKEND", label: "Weekend" },
  { value: "HALF_DAY", label: "Half day" },
  { value: "MISSING_CHECKOUT", label: "Missing checkout" },
];

function Form({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  const adjust = useAdjustAttendance(record.id);
  const [checkIn, setCheckIn] = useState<string | null>(record.check_in);
  const [checkOut, setCheckOut] = useState<string | null>(record.check_out);
  const [status, setStatus] = useState<AttendanceStatus>(record.status);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await adjust.mutateAsync({
        check_in: checkIn,
        check_out: checkOut,
        status,
        reason,
      });
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Check-in" htmlFor="adjust_check_in" description="Your local time zone">
          <DateTimePicker id="adjust_check_in" value={checkIn} onChange={setCheckIn} />
        </FormField>
        <FormField label="Check-out" htmlFor="adjust_check_out" description="Your local time zone">
          <DateTimePicker id="adjust_check_out" value={checkOut} onChange={setCheckOut} />
        </FormField>
      </div>
      <FormField label="Status">
        <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Reason" htmlFor="adjust_reason" description="Required — every correction is logged (§32).">
        <Textarea id="adjust_reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
      </FormField>
      <DialogFooter>
        <Button type="submit" disabled={adjust.isPending || !reason.trim()}>
          Save correction
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AdjustAttendanceDialog({
  record,
  onClose,
}: {
  record: AttendanceRecord | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={record !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {record ? `Correct attendance — ${record.employee.full_name} (${record.work_date})` : "Correct attendance"}
          </DialogTitle>
        </DialogHeader>
        {record && <Form key={record.id} record={record} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
