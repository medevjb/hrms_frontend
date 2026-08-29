"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { AlertCircleIcon } from "lucide-react";
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

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
}

function fromLocalInputValue(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function Form({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  const adjust = useAdjustAttendance(record.id);
  const [checkIn, setCheckIn] = useState(toLocalInputValue(record.check_in));
  const [checkOut, setCheckOut] = useState(toLocalInputValue(record.check_out));
  const [status, setStatus] = useState<AttendanceStatus>(record.status);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await adjust.mutateAsync({
        check_in: fromLocalInputValue(checkIn) ?? null,
        check_out: fromLocalInputValue(checkOut) ?? null,
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
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Check-in"
          htmlFor="adjust_check_in"
          description="Your local time zone"
        >
          <Input
            id="adjust_check_in"
            type="datetime-local"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </FormField>
        <FormField
          label="Check-out"
          htmlFor="adjust_check_out"
          description="Your local time zone"
        >
          <Input
            id="adjust_check_out"
            type="datetime-local"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
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
