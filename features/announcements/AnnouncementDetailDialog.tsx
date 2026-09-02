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
import { Badge } from "@/components/ui/badge";
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
      return <AlertTriangleIcon className="size-4 text-red-500" />;
    case "HR_NOTICE":
      return <BriefcaseIcon className="size-4 text-blue-500" />;
    case "POLICY":
      return <ShieldCheckIcon className="size-4 text-purple-500" />;
    case "HOLIDAY":
      return <CalendarIcon className="size-4 text-emerald-500" />;
    case "PAYROLL":
      return <DollarSignIcon className="size-4 text-amber-500" />;
    case "TEAM":
      return <UsersIcon className="size-4 text-indigo-500" />;
    default:
      return <MegaphoneIcon className="size-4 text-slate-500" />;
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
    <div className="space-y-4 pt-1">
      {/* Category & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-0.5 px-2 font-medium">
            <CategoryIcon type={announcement.type} />
            <span>{typeLabel(announcement.type)}</span>
          </Badge>
          <span className="text-muted-foreground flex items-center gap-1">
            <ClockIcon className="size-3" />
            {formatDate(announcement.published_at ?? announcement.created_at)}
          </span>
        </div>

        {announcement.created_by && (
          <span className="text-muted-foreground text-[11px]">
            From: <strong className="text-foreground">{announcement.created_by.name}</strong>
          </span>
        )}
      </div>

      {/* Content Body */}
      <div className="max-h-[55vh] overflow-y-auto whitespace-pre-line text-sm leading-relaxed p-4 rounded-xl bg-muted/20 border border-border/50 text-foreground">
        {announcement.content}
      </div>

      {/* Requirement Notice */}
      {needsAck && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs">
          <AlertCircleIcon className="size-4 shrink-0" />
          <span>This official announcement requires your explicit acknowledgement.</span>
        </div>
      )}

      {isAcknowledged && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs">
          <CheckCircle2Icon className="size-4 shrink-0" />
          <span>You acknowledged this announcement.</span>
        </div>
      )}

      <DialogFooter className="pt-2 border-t border-border/60">
        {needsAck ? (
          <Button
            className="w-full sm:w-auto gap-2"
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
            <span>I Acknowledge This Notice</span>
          </Button>
        ) : (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </DialogFooter>
    </div>
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-lg font-bold">{announcement?.title}</DialogTitle>
        </DialogHeader>
        {announcement && <Body key={announcement.id} announcement={announcement} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

