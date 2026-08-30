"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { usePublishAnnouncement, useAnnouncements } from "@/services/announcements";
import type { Announcement, AnnouncementStatus } from "@/types/announcements";
import { AnnouncementDetailDialog } from "./AnnouncementDetailDialog";

const STATUS_TONE: Record<AnnouncementStatus, StatusTone> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  EXPIRED: "warning",
};

function typeLabel(type: string): string {
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function PublishButton({ announcement }: { announcement: Announcement }) {
  const publish = usePublishAnnouncement(announcement.id);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={publish.isPending}
      onClick={async () => {
        try {
          await publish.mutateAsync();
          toast.success("Announcement published");
        } catch {
          toast.error("Could not publish");
        }
      }}
    >
      Publish
    </Button>
  );
}

export function AnnouncementsList({ mode }: { mode: "feed" | "manage" }) {
  const user = useCurrentUser();
  const canPublish = user.permissions.includes("announcement.publish");
  const { data, isLoading } = useAnnouncements(mode === "feed" ? { mine: true } : {});
  const [selected, setSelected] = useState<Announcement | null>(null);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  const announcements = data?.data ?? [];

  if (announcements.length === 0) {
    return (
      <EmptyState
        title="No announcements"
        description={
          mode === "feed"
            ? "Company notices shared with you will show up here."
            : "Draft an announcement to get started."
        }
      />
    );
  }

  if (mode === "feed") {
    return (
      <>
        <div className="space-y-3">
          {announcements.map((announcement) => {
            const unread = !announcement.my_read;
            const needsAck =
              announcement.acknowledgement_required && !announcement.my_read?.acknowledged;

            return (
              <button
                key={announcement.id}
                type="button"
                onClick={() => setSelected(announcement)}
                className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{announcement.title}</span>
                      {unread && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{announcement.content}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusChip tone="info">{typeLabel(announcement.type)}</StatusChip>
                    {needsAck && <StatusChip tone="warning">Acknowledge</StatusChip>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <AnnouncementDetailDialog announcement={selected} onClose={() => setSelected(null)} />
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Audience</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Read</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map((announcement) => (
            <TableRow key={announcement.id}>
              <TableCell className="font-medium">{announcement.title}</TableCell>
              <TableCell>{typeLabel(announcement.type)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {typeLabel(announcement.audience_type)}
              </TableCell>
              <TableCell>
                <StatusChip tone={STATUS_TONE[announcement.status]}>
                  {typeLabel(announcement.status)}
                </StatusChip>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {announcement.status === "DRAFT"
                  ? "—"
                  : announcement.acknowledgement_required
                    ? `${announcement.acknowledged_count ?? 0} ack`
                    : `${announcement.read_count ?? 0}`}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  {announcement.status === "DRAFT" && canPublish && (
                    <PublishButton announcement={announcement} />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
