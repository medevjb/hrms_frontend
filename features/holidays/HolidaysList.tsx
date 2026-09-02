"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { MapPinIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useDeleteHoliday, useHolidays } from "@/services/holidays";
import type { Holiday } from "@/types/holidays";
import { HOLIDAY_TYPE_BADGE, HOLIDAY_TYPE_LABEL } from "./constants";
import { SaveHolidayModal } from "./SaveHolidayModal";

const RANGE_OPTIONS = [
  { value: "upcoming", label: "Upcoming & today" },
  { value: "past", label: "Past" },
  { value: "all", label: "All dates" },
] as const;

type RangeFilter = (typeof RANGE_OPTIONS)[number]["value"];

const EMPTY_COPY: Record<RangeFilter, { title: string; description: string }> = {
  upcoming: {
    title: "No upcoming holidays",
    description: "Nothing is scheduled from today onward. Switch to “Past” to see earlier ones.",
  },
  past: { title: "No past holidays", description: "Nothing on the calendar before today." },
  all: { title: "No holidays yet", description: "Add the first holiday to the calendar." },
};

export function HolidaysList() {
  const user = useCurrentUser();
  const canManage = user.permissions.includes("holiday.manage");
  const { data: holidays, isLoading } = useHolidays();
  const deleteHoliday = useDeleteHoliday();
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<Holiday | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Holiday | null>(null);
  const [range, setRange] = useState<RangeFilter>("upcoming");

  const visible = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const scoped = (holidays ?? []).filter((holiday) => {
      if (range === "upcoming") return holiday.date >= today;
      if (range === "past") return holiday.date < today;
      return true;
    });

    return scoped.sort((a, b) =>
      range === "past" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
    );
  }, [holidays, range]);

  function openEdit(holiday: Holiday) {
    setEditing(holiday);
    open();
  }

  function confirmDelete() {
    if (!pendingDelete) return;

    deleteHoliday.mutate(pendingDelete.id, {
      onSuccess: () => toast.success("Holiday deleted"),
      onSettled: () => setPendingDelete(null),
    });
  }

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Select value={range} onValueChange={(value) => setRange(value as RangeFilter)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {visible.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {visible.length} holiday{visible.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState title={EMPTY_COPY[range].title} description={EMPTY_COPY[range].description} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Holiday</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="align-top">
                    <div className="flex flex-wrap items-center gap-2 font-medium">
                      {holiday.title}
                      {holiday.source === "GOOGLE_BD" && (
                        <Badge variant="secondary" className="font-normal">
                          Google · BD
                        </Badge>
                      )}
                    </div>
                    {holiday.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{holiday.description}</p>
                    )}
                    {holiday.office_location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPinIcon className="size-3" />
                        {holiday.office_location}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="align-top font-mono text-sm whitespace-nowrap">
                    {holiday.date}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {format(parseISO(holiday.date), "EEE")}
                    </span>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={HOLIDAY_TYPE_BADGE[holiday.type]}>
                      {HOLIDAY_TYPE_LABEL[holiday.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <StatusChip tone={holiday.active ? "success" : "neutral"}>
                      {holiday.active ? "Active" : "Inactive"}
                    </StatusChip>
                  </TableCell>
                  {canManage && (
                    <TableCell className="align-top">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(holiday)}
                          aria-label="Edit holiday"
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setPendingDelete(holiday)}
                          aria-label="Delete holiday"
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SaveHolidayModal opened={opened} onClose={close} holiday={editing} />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {pendingDelete?.title} from the holiday calendar?
              {pendingDelete?.source === "GOOGLE_BD" &&
                " It will come back on the next Bangladesh holiday sync."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
