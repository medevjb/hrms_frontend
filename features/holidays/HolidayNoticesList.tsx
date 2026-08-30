"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { holidayNoticeDownloadUrl, useHolidayNotices } from "@/services/holiday-notices";
import type { HolidayNotice, HolidayNoticeStatus } from "@/types/holidays";
import { ApproveHolidayNoticeDialog } from "./ApproveHolidayNoticeDialog";

const STATUS_TONE: Record<HolidayNoticeStatus, StatusTone> = {
  PENDING_APPROVAL: "warning",
  PUBLISHED: "success",
  DISMISSED: "neutral",
};

const STATUS_LABEL: Record<HolidayNoticeStatus, string> = {
  PENDING_APPROVAL: "Awaiting Head HR",
  PUBLISHED: "Published",
  DISMISSED: "Dismissed",
};

export function HolidayNoticesList() {
  const user = useCurrentUser();
  const canApprove = user.permissions.includes("holiday.notice.approve");
  const { data: notices, isLoading } = useHolidayNotices();
  const [approving, setApproving] = useState<HolidayNotice | null>(null);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!notices || notices.length === 0) {
    return (
      <EmptyState
        title="No holiday notices"
        description="Five days before each holiday, a notice is drafted here for Head HR to review and sign."
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Holiday</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Signed by</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {notices.map((notice) => (
              <TableRow key={notice.id}>
                <TableCell className="font-mono text-xs">{notice.reference}</TableCell>
                <TableCell className="font-medium">{notice.holiday.title}</TableCell>
                <TableCell className="font-mono text-sm">{notice.holiday.date}</TableCell>
                <TableCell>
                  <StatusChip tone={STATUS_TONE[notice.status]}>
                    {STATUS_LABEL[notice.status]}
                  </StatusChip>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {notice.signatory_name ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {notice.status === "PENDING_APPROVAL" && canApprove && (
                      <Button variant="ghost" size="sm" onClick={() => setApproving(notice)}>
                        Review
                      </Button>
                    )}
                    {notice.has_document && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={holidayNoticeDownloadUrl(notice.id)} target="_blank" rel="noreferrer">
                          Download PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ApproveHolidayNoticeDialog notice={approving} onClose={() => setApproving(null)} />
    </>
  );
}
