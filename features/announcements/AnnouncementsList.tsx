"use client";

import { useMemo, useState } from "react";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowUpDownIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  MegaphoneIcon,
  RotateCcwIcon,
  SearchIcon,
  SendIcon,
  ShieldCheckIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { RowActions } from "@/components/ui/RowActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useDisclosure } from "@/hooks/use-disclosure";
import {
  useAnnouncements,
  useDeleteAnnouncement,
  usePublishAnnouncement,
} from "@/services/announcements";
import type { Announcement, AnnouncementStatus, AnnouncementType } from "@/types/announcements";
import { AnnouncementDetailDialog } from "./AnnouncementDetailDialog";
import { SaveAnnouncementDialog } from "./SaveAnnouncementDialog";

const STATUS_TONE: Record<AnnouncementStatus, StatusTone> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  EXPIRED: "warning",
};

const CATEGORIES: { value: AnnouncementType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "HR_NOTICE", label: "HR notice" },
  { value: "POLICY", label: "Policy" },
  { value: "PAYROLL", label: "Payroll" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "TEAM", label: "Team" },
  { value: "GENERAL", label: "General" },
];

type SortOption = "newest" | "oldest" | "title_asc" | "action_required";

function CategoryIcon({
  type,
  className = "size-3.5",
}: {
  type: AnnouncementType;
  className?: string;
}) {
  switch (type) {
    case "EMERGENCY":
      return <AlertTriangleIcon className={`${className} text-red-500`} />;
    case "HR_NOTICE":
      return <BriefcaseIcon className={`${className} text-blue-500`} />;
    case "POLICY":
      return <ShieldCheckIcon className={`${className} text-purple-500`} />;
    case "HOLIDAY":
      return <CalendarIcon className={`${className} text-emerald-500`} />;
    case "PAYROLL":
      return <DollarSignIcon className={`${className} text-amber-500`} />;
    case "TEAM":
      return <UsersIcon className={`${className} text-indigo-500`} />;
    default:
      return <MegaphoneIcon className={`${className} text-slate-500`} />;
  }
}

const CATEGORY_BADGE: Record<AnnouncementType, string> = {
  EMERGENCY: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25",
  HR_NOTICE: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
  POLICY: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/25",
  HOLIDAY: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  PAYROLL: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  TEAM: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25",
  GENERAL: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/25",
};

function CategoryBadge({ type }: { type: AnnouncementType }) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium whitespace-nowrap ${CATEGORY_BADGE[type]}`}
    >
      <CategoryIcon type={type} className="size-3" />
      {typeLabel(type)}
    </span>
  );
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
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function PublishButton({ announcement }: { announcement: Announcement }) {
  const publish = usePublishAnnouncement(announcement.id);

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
      disabled={publish.isPending}
      onClick={() => {
        publish.mutate(undefined, {
          onSuccess: () => toast.success("Announcement published"),
        });
      }}
    >
      <SendIcon className="size-3.5" />
      Publish
    </Button>
  );
}

function ReachMeter({ announcement }: { announcement: Announcement }) {
  if (announcement.status === "DRAFT") {
    return <span className="text-muted-foreground">—</span>;
  }

  const reads = announcement.read_count ?? 0;

  if (!announcement.acknowledgement_required) {
    return (
      <span className="font-mono text-xs tabular-nums text-foreground">
        {reads} <span className="text-muted-foreground">read</span>
      </span>
    );
  }

  const acked = announcement.acknowledged_count ?? 0;
  const pct = reads > 0 ? Math.round((acked / reads) * 100) : 0;

  return (
    <div className="flex min-w-[7rem] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[11px] tabular-nums whitespace-nowrap text-muted-foreground">
        {acked}/{reads}
      </span>
    </div>
  );
}

export function AnnouncementsList({ mode }: { mode: "feed" | "manage" }) {
  const user = useCurrentUser();
  const canPublish = user.permissions.includes("announcement.publish");
  const canManage = user.permissions.includes("announcement.create");

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<AnnouncementType | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<AnnouncementStatus | "ALL">("ALL");
  const [sortOrder, setSortOrder] = useState<SortOption>("newest");

  const { data, isLoading } = useAnnouncements(mode === "feed" ? { mine: true } : {});
  const deleteAnnouncement = useDeleteAnnouncement();
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [editing, setEditing] = useState<Announcement | undefined>(undefined);
  const [editOpen, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [pendingDelete, setPendingDelete] = useState<Announcement | null>(null);

  const rawList = useMemo(() => data?.data ?? [], [data]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rawList.length };
    rawList.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [rawList]);

  const filteredAnnouncements = useMemo(() => {
    let list = [...rawList];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q),
      );
    }

    if (selectedType !== "ALL") {
      list = list.filter((a) => a.type === selectedType);
    }

    if (mode === "manage" && selectedStatus !== "ALL") {
      list = list.filter((a) => a.status === selectedStatus);
    }

    list.sort((a, b) => {
      if (sortOrder === "action_required") {
        const aNeeds = a.acknowledgement_required && !a.my_read?.acknowledged ? 1 : 0;
        const bNeeds = b.acknowledgement_required && !b.my_read?.acknowledged ? 1 : 0;
        if (aNeeds !== bNeeds) return bNeeds - aNeeds;
      }
      if (sortOrder === "oldest") {
        return (
          new Date(a.published_at ?? a.created_at ?? 0).getTime() -
          new Date(b.published_at ?? b.created_at ?? 0).getTime()
        );
      }
      if (sortOrder === "title_asc") {
        return a.title.localeCompare(b.title);
      }
      return (
        new Date(b.published_at ?? b.created_at ?? 0).getTime() -
        new Date(a.published_at ?? a.created_at ?? 0).getTime()
      );
    });

    return list;
  }, [rawList, search, selectedType, selectedStatus, sortOrder, mode]);

  const isFilterActive =
    search.trim() !== "" ||
    selectedType !== "ALL" ||
    (mode === "manage" && selectedStatus !== "ALL") ||
    sortOrder !== "newest";

  function resetFilters() {
    setSearch("");
    setSelectedType("ALL");
    setSelectedStatus("ALL");
    setSortOrder("newest");
  }

  function startEdit(announcement: Announcement) {
    setEditing(announcement);
    openEdit();
  }

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedType === cat.value;
          const count = categoryCounts[cat.value] || 0;

          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedType(cat.value)}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat.value !== "ALL" && (
                <CategoryIcon type={cat.value as AnnouncementType} className="size-3.5" />
              )}
              {cat.label}
              <span
                className={`min-w-[1.25rem] rounded-full px-1 text-center font-mono text-[10px] leading-4 font-semibold ${
                  isSelected ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title or content"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-8 pl-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {mode === "manage" && (
            <Select
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as AnnouncementStatus | "ALL")}
            >
              <SelectTrigger className="w-[130px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All statuses</SelectItem>
                <SelectItem value="DRAFT" className="text-xs">Draft</SelectItem>
                <SelectItem value="PUBLISHED" className="text-xs">Published</SelectItem>
                <SelectItem value="EXPIRED" className="text-xs">Expired</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOption)}>
            <SelectTrigger className="w-[140px] text-xs">
              <ArrowUpDownIcon className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-xs">Newest first</SelectItem>
              <SelectItem value="oldest" className="text-xs">Oldest first</SelectItem>
              <SelectItem value="title_asc" className="text-xs">Title A–Z</SelectItem>
              {mode === "feed" && (
                <SelectItem value="action_required" className="text-xs">Action required</SelectItem>
              )}
            </SelectContent>
          </Select>

          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcwIcon className="size-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {isFilterActive && (
        <p className="px-1 text-xs text-muted-foreground">
          Showing {filteredAnnouncements.length} of {rawList.length}
        </p>
      )}

      {filteredAnnouncements.length === 0 ? (
        <EmptyState
          title={isFilterActive ? "No matching announcements" : "No announcements yet"}
          description={
            isFilterActive
              ? "Try a different search or clear the active filters."
              : mode === "feed"
                ? "Company notices shared with you will show up here."
                : "Draft or publish an announcement to get started."
          }
          action={isFilterActive ? { label: "Clear filters", onClick: resetFilters } : undefined}
        />
      ) : mode === "feed" ? (
        <ul className="space-y-2.5">
          {filteredAnnouncements.map((announcement) => {
            const unread = !announcement.my_read;
            const needsAck =
              announcement.acknowledgement_required && !announcement.my_read?.acknowledged;
            const accent = needsAck
              ? "before:bg-amber-500"
              : unread
                ? "before:bg-primary"
                : "before:bg-transparent";

            return (
              <li key={announcement.id}>
                <button
                  type="button"
                  onClick={() => setSelected(announcement)}
                  className={`relative w-full overflow-hidden rounded-xl border border-border/70 bg-card p-4 text-left transition-colors before:absolute before:inset-y-0 before:left-0 before:w-1 hover:bg-muted/40 ${accent}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge type={announcement.type} />
                    {needsAck && (
                      <span className="inline-flex h-6 items-center gap-1 rounded-full bg-amber-500/15 px-2 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                        <AlertCircleIcon className="size-3" />
                        Acknowledgement needed
                      </span>
                    )}
                    {unread && !needsAck && (
                      <span className="inline-flex h-6 items-center rounded-full bg-primary/10 px-2 text-[11px] font-medium text-primary">
                        New
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 text-[15px] leading-snug font-semibold text-foreground">
                    {announcement.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {announcement.content}
                  </p>

                  <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3 font-mono text-[11px] text-muted-foreground">
                    <ClockIcon className="size-3" />
                    <span>{formatDate(announcement.published_at ?? announcement.created_at)}</span>
                    {announcement.created_by && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="font-sans">{announcement.created_by.name}</span>
                      </>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[42%]">Notice</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reach</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnnouncements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell className="max-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {announcement.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {typeLabel(announcement.audience_type)} · {announcement.content}
                    </p>
                  </TableCell>

                  <TableCell>
                    <CategoryBadge type={announcement.type} />
                  </TableCell>

                  <TableCell>
                    <StatusChip tone={STATUS_TONE[announcement.status]}>
                      {typeLabel(announcement.status)}
                    </StatusChip>
                  </TableCell>

                  <TableCell>
                    <ReachMeter announcement={announcement} />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {announcement.status === "DRAFT" && canPublish && (
                        <PublishButton announcement={announcement} />
                      )}
                      <RowActions
                        onView={() => setSelected(announcement)}
                        onEdit={
                          announcement.status === "DRAFT" && canManage
                            ? () => startEdit(announcement)
                            : undefined
                        }
                        onDelete={
                          announcement.status === "DRAFT" && canManage
                            ? () => setPendingDelete(announcement)
                            : undefined
                        }
                        deleteTitle="Delete draft"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AnnouncementDetailDialog announcement={selected} onClose={() => setSelected(null)} />

      <SaveAnnouncementDialog
        opened={editOpen}
        onClose={() => {
          closeEdit();
          setEditing(undefined);
        }}
        announcement={editing}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => !next && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.title ?? "announcement"}"?`}
        description="This permanently removes the draft. Published announcements are a record of what people were shown and can't be deleted."
        confirmLabel="Delete draft"
        destructive
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteAnnouncement.mutateAsync(pendingDelete.id);
          toast.success("Draft deleted");
        }}
      />
    </div>
  );
}
