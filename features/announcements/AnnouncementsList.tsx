"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { RowActions } from "@/components/ui/RowActions";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useAnnouncements, useDeleteAnnouncement, usePublishAnnouncement } from "@/services/announcements";
import { apiErrorMessage } from "@/lib/api-error";
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
  const canManage = user.permissions.includes("announcement.create");
  const { data, isLoading } = useAnnouncements(mode === "feed" ? { mine: true } : {});
  const deleteAnnouncement = useDeleteAnnouncement();
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Announcement | null>(null);

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
        <div className="space-y-3.5">
          {announcements.map((announcement) => {
            const unread = !announcement.my_read;
            const needsAck =
              announcement.acknowledgement_required && !announcement.my_read?.acknowledged;

            return (
              <button
                key={announcement.id}
                type="button"
                onClick={() => setSelected(announcement)}
                className="w-full rounded-2xl border border-border/70 bg-card p-4 text-left shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-base">{announcement.title}</span>
                      {unread && <span className="size-2 rounded-full bg-primary animate-pulse" aria-label="Unread" />}
                    </div>
                    <p className="line-clamp-2 text-xs font-medium text-muted-foreground">{announcement.content}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusChip tone={announcement.type === "EMERGENCY" ? "danger" : "info"}>{typeLabel(announcement.type)}</StatusChip>
                    {needsAck && <StatusChip tone="warning">Requires Acknowledgment</StatusChip>}
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
    <>
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Audience</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Read / Ack</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map((announcement) => (
            <TableRow key={announcement.id}>
              <TableCell className="font-bold text-foreground">{announcement.title}</TableCell>
              <TableCell className="text-xs font-medium text-muted-foreground">{typeLabel(announcement.type)}</TableCell>
              <TableCell className="text-xs font-medium text-muted-foreground">
                {typeLabel(announcement.audience_type)}
              </TableCell>
              <TableCell>
                <StatusChip tone={STATUS_TONE[announcement.status]}>
                  {typeLabel(announcement.status)}
                </StatusChip>
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold">
                {announcement.status === "DRAFT"
                  ? "—"
                  : announcement.acknowledgement_required
                    ? `${announcement.acknowledged_count ?? 0} ack`
                    : `${announcement.read_count ?? 0}`}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {announcement.status === "DRAFT" && canPublish && (
                    <PublishButton announcement={announcement} />
                  )}
                  {announcement.status === "DRAFT" && canManage && (
                    <RowActions onDelete={() => setPendingDelete(announcement)} />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => !next && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.title ?? "announcement"}"?`}
        description="This permanently removes the draft. Published announcements are a record of what people were shown and can't be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteAnnouncement.mutateAsync(pendingDelete.id);
            toast.success("Draft deleted");
          } catch (caught) {
            toast.error(apiErrorMessage(caught, "Could not delete draft"));
          }
        }}
      />
    </>
  );
}
