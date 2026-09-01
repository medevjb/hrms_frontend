"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { toast } from "@/components/ui/toast";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-error";
import { useApproveHolidayNotice, useDismissHolidayNotice } from "@/services/holiday-notices";
import type { HolidayNotice } from "@/types/holidays";

function Form({ notice, onClose }: { notice: HolidayNotice; onClose: () => void }) {
  const approve = useApproveHolidayNotice(notice.id);
  const dismiss = useDismissHolidayNotice(notice.id);

  const [message, setMessage] = useState(notice.message);
  const [closureNote, setClosureNote] = useState(notice.closure_note ?? "");
  const [returnDate, setReturnDate] = useState<string | null>(notice.return_date);
  const [error, setError] = useState<string | null>(null);

  const pending = approve.isPending || dismiss.isPending;

  async function handleApprove(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await approve.mutateAsync({
        message,
        closure_note: closureNote || null,
        return_date: returnDate,
      });
      toast.success("Notice published — employees have been notified");
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleApprove} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <p className="font-medium">{notice.holiday.title}</p>
        <p className="text-muted-foreground">
          {notice.holiday.date} · notice {notice.reference}
        </p>
      </div>

      <FormField label="Message" htmlFor="notice_message">
        <Textarea
          id="notice_message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
        />
      </FormField>

      <FormField label="Closure information" htmlFor="notice_closure" description="Optional">
        <Textarea
          id="notice_closure"
          value={closureNote}
          onChange={(e) => setClosureNote(e.target.value)}
          rows={2}
        />
      </FormField>

      <FormField label="Return date" description="First working day back">
        <DatePicker value={returnDate} onChange={setReturnDate} />
      </FormField>

      <DialogFooter className="justify-between sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={async () => {
            try {
              await dismiss.mutateAsync();
              toast.success("Notice dismissed");
              onClose();
            } catch {
              toast.error("Could not dismiss");
            }
          }}
        >
          Dismiss
        </Button>
        <Button type="submit" disabled={pending}>
          Approve &amp; publish
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ApproveHolidayNoticeDialog({
  notice,
  onClose,
}: {
  notice: HolidayNotice | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={notice !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review holiday notice</DialogTitle>
        </DialogHeader>
        {notice && <Form key={notice.id} notice={notice} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
