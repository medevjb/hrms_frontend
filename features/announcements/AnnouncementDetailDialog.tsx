"use client";

import { useEffect, useRef } from "react";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  DollarSignIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMarkAnnouncementRead } from "@/services/announcements";
import type { Announcement, AnnouncementType } from "@/types/announcements";

function CategoryIcon({ type }: { type: AnnouncementType }) {
  switch (type) {
    case "EMERGENCY":
      return <AlertTriangleIcon className="size-3.5 text-red-500" />;
    case "HR_NOTICE":
      return <BriefcaseIcon className="size-3.5 text-blue-500" />;
    case "POLICY":
      return <ShieldCheckIcon className="size-3.5 text-purple-500" />;
    case "HOLIDAY":
      return <CalendarIcon className="size-3.5 text-emerald-500" />;
    case "PAYROLL":
      return <DollarSignIcon className="size-3.5 text-amber-500" />;
    case "TEAM":
      return <UsersIcon className="size-3.5 text-indigo-500" />;
    default:
      return <MegaphoneIcon className="size-3.5 text-slate-500" />;
  }
}

function typeLabel(type: string): string {
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function Body({ announcement, onClose }: { announcement: Announcement; onClose: () => void }) {
  const markRead = useMarkAnnouncementRead(announcement.id);
  const marked = useRef(false);

  useEffect(() => {
    if (!marked.current && !announcement.my_read) {
      marked.current = true;
      markRead.mutate(false);
    }
  }, [announcement.my_read, markRead]);

  const isAcknowledged = announcement.my_read?.acknowledged;
  const needsAck = announcement.acknowledgement_required && !isAcknowledged;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2 py-0.5 font-medium">
            <CategoryIcon type={announcement.type} />
            {typeLabel(announcement.type)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <ClockIcon className="size-3" />
            {formatDate(announcement.published_at ?? announcement.created_at)}
            {announcement.created_by && (
              <>
                <span aria-hidden>·</span>
                <span>{announcement.created_by.name}</span>
              </>
            )}
          </span>
        </div>

        <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-border/50 bg-muted/20 p-4 text-sm leading-relaxed whitespace-pre-line text-foreground">
          {announcement.content}
        </div>

        {needsAck && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircleIcon className="size-4 shrink-0" />
            <span>This notice needs your acknowledgement.</span>
          </div>
        )}

        {isAcknowledged && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2Icon className="size-4 shrink-0" />
            <span>You acknowledged this notice.</span>
          </div>
        )}
      </div>

      <DialogFooter>
        {needsAck ? (
          <Button
            className="gap-2"
            disabled={markRead.isPending}
            onClick={() => {
              markRead.mutate(true, {
                onSuccess: () => {
                  toast.success("Announcement acknowledged");
                  onClose();
                },
              });
            }}
          >
            <CheckCircle2Icon className="size-4" />
            Acknowledge
          </Button>
        ) : (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export function AnnouncementDetailDialog({
  announcement,
  onClose,
}: {
  announcement: Announcement | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={announcement !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{announcement?.title}</DialogTitle>
        </DialogHeader>
        {announcement && <Body key={announcement.id} announcement={announcement} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
