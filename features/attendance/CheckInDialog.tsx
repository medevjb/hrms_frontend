"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { formatTimeInTimezone } from "@/lib/format-time";
import { useAttendanceToday, useCheckIn } from "@/services/attendance";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * §26's check-in popup — mounted once in the dashboard shell so it shows
 * up wherever the employee lands, not just one page. "Not Now" dismisses
 * for the rest of this visit; it comes back on the next full load if they
 * still haven't checked in (§137's prompt-suppression already keeps it
 * from ever showing on a weekend/holiday/leave day, or once checked in).
 */
export function CheckInDialog() {
  const user = useCurrentUser();
  const { data: today } = useAttendanceToday();
  const checkIn = useCheckIn();
  const [dismissed, setDismissed] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!today || !today.should_prompt_check_in || dismissed) {
    return null;
  }

  const tz = user.organization.timezone;

  function handleCheckIn() {
    checkIn.mutate(undefined, { onSuccess: () => toast.success("Checked in") });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setDismissed(true)}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{greeting()}</DialogTitle>
          {today.shift && (
            <DialogDescription>
              Today&apos;s shift: {formatTimeInTimezone(today.shift_start!, tz)} –{" "}
              {formatTimeInTimezone(today.shift_end!, tz)}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-1 text-sm">
          {today.grace_end && (
            <p className="text-muted-foreground">
              Flexible check-in until{" "}
              <span className="font-mono text-foreground">{formatTimeInTimezone(today.grace_end, tz)}</span>
            </p>
          )}
          <p className="text-muted-foreground">
            Current time <span className="font-mono text-foreground">{formatTimeInTimezone(now, tz)}</span>
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDismissed(true)}>
            Not now
          </Button>
          <Button onClick={handleCheckIn} disabled={checkIn.isPending}>
            Check in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
