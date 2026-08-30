"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMarkAnnouncementRead } from "@/services/announcements";
import type { Announcement } from "@/types/announcements";

function Body({ announcement, onClose }: { announcement: Announcement; onClose: () => void }) {
  const markRead = useMarkAnnouncementRead(announcement.id);
  const marked = useRef(false);

  // Opening an announcement is a read (docs/PRD.md §57) — record it once,
  // without acknowledgement, unless the employee already has a read row.
  useEffect(() => {
    if (!marked.current && !announcement.my_read) {
      marked.current = true;
      markRead.mutate(false);
    }
  }, [announcement.my_read, markRead]);

  const needsAck = announcement.acknowledgement_required && !announcement.my_read?.acknowledged;

  return (
    <>
      <p className="text-xs text-muted-foreground">
        {announcement.published_at
          ? new Date(announcement.published_at).toLocaleDateString()
          : null}
      </p>
      <div className="max-h-[50vh] overflow-y-auto whitespace-pre-line text-sm leading-relaxed">
        {announcement.content}
      </div>
      <DialogFooter>
        {needsAck ? (
          <Button
            disabled={markRead.isPending}
            onClick={async () => {
              try {
                await markRead.mutateAsync(true);
                toast.success("Acknowledged");
                onClose();
              } catch {
                toast.error("Could not acknowledge");
              }
            }}
          >
            I acknowledge this
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
