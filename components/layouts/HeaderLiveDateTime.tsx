"use client";

import { useState, useEffect } from "react";
import { CalendarDaysIcon, ClockIcon } from "lucide-react";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";

export function HeaderLiveDateTime() {
  const user = useCurrentUser();
  const timezone = user.organization?.timezone || "Asia/Dhaka";
  const [timeStr, setTimeStr] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");

  useEffect(() => {
    const update = () => {
      try {
        const now = new Date();
        const formattedTime = new Intl.DateTimeFormat(undefined, {
          timeZone: timezone,
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(now);

        const formattedDate = new Intl.DateTimeFormat(undefined, {
          timeZone: timezone,
          weekday: "short",
          day: "numeric",
          month: "short",
        }).format(now);

        setTimeStr(formattedTime);
        setDateStr(formattedDate);
      } catch {
        setTimeStr("09:45 AM");
        setDateStr("Mon, 11 May");
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="hidden lg:flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-xs">
      <CalendarDaysIcon className="size-3.5 text-primary" />
      <span className="text-foreground">{dateStr || "Mon, 11 May"}</span>
      <span className="text-border">•</span>
      <ClockIcon className="size-3.5 text-emerald-500" />
      <span className="font-mono text-foreground font-bold">{timeStr || "09:45 AM"}</span>
    </div>
  );
}
