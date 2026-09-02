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
  EyeIcon,
  FilterIcon,
  MegaphoneIcon,
  RotateCcwIcon,
  SearchIcon,
  SendIcon,
  ShieldCheckIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
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
import { useAnnouncements, useDeleteAnnouncement, usePublishAnnouncement } from "@/services/announcements";
import type { Announcement, AnnouncementStatus, AnnouncementType } from "@/types/announcements";
import { AnnouncementDetailDialog } from "./AnnouncementDetailDialog";

const STATUS_TONE: Record<AnnouncementStatus, StatusTone> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  EXPIRED: "warning",
};

const CATEGORIES: { value: AnnouncementType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Categories" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "HR_NOTICE", label: "HR Notice" },
  { value: "POLICY", label: "Policy" },
  { value: "PAYROLL", label: "Payroll" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "TEAM", label: "Team" },
  { value: "GENERAL", label: "General" },
];

type SortOption = "newest" | "oldest" | "title_asc" | "action_required";

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

function categoryBadgeStyle(type: AnnouncementType): string {
  switch (type) {
    case "EMERGENCY":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
    case "HR_NOTICE":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
    case "POLICY":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
    case "HOLIDAY":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    case "PAYROLL":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
    case "TEAM":
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30";
    default:
      return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30";
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
      className="h-8 gap-1.5 text-xs text-emerald-700 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 dark:text-emerald-400"
      disabled={publish.isPending}
      onClick={() => {
        publish.mutate(undefined, {
          onSuccess: () => toast.success("Announcement published successfully"),
        });
      }}
    >
      <SendIcon className="size-3" />
      <span>Publish</span>
    </Button>
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
  const [pendingDelete, setPendingDelete] = useState<Announcement | null>(null);

  const rawList = data?.data ?? [];

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

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedType === cat.value;
          const count = categoryCounts[cat.value] || 0;

          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedType(cat.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border shrink-0 ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                  : "bg-card hover:bg-muted text-muted-foreground border-border/80 hover:text-foreground"
              }`}
            >
              {cat.value !== "ALL" && <CategoryIcon type={cat.value as AnnouncementType} />}
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-card p-3.5 rounded-2xl border border-border/70 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-9 text-sm h-10 bg-background/50 rounded-xl"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedType}
              onValueChange={(v) => setSelectedType(v as AnnouncementType | "ALL")}
            >
              <SelectTrigger className="w-[170px] text-xs h-10 rounded-xl bg-background/50">
                <div className="flex items-center gap-2 truncate">
                  <FilterIcon className="size-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs">
                    <div className="flex items-center gap-2">
                      {cat.value !== "ALL" && <CategoryIcon type={cat.value as AnnouncementType} />}
                      <span>{cat.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {mode === "manage" && (
              <Select
                value={selectedStatus}
                onValueChange={(v) => setSelectedStatus(v as AnnouncementStatus | "ALL")}
              >
                <SelectTrigger className="w-[150px] text-xs h-10 rounded-xl bg-background/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-slate-400" />
                      <span>All Statuses</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="DRAFT" className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-slate-400" />
                      <span>Draft</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PUBLISHED" className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span>Published</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="EXPIRED" className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-amber-500" />
                      <span>Expired</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOption)}>
              <SelectTrigger className="w-[160px] text-xs h-10 rounded-xl bg-background/50">
                <div className="flex items-center gap-2 truncate">
                  <ArrowUpDownIcon className="size-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Sort order" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
                <SelectItem value="oldest" className="text-xs">Oldest First</SelectItem>
                <SelectItem value="title_asc" className="text-xs">Title (A-Z)</SelectItem>
                {mode === "feed" && (
                  <SelectItem value="action_required" className="text-xs">Action Required</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isFilterActive && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-medium">
                Showing {filteredAnnouncements.length} of {rawList.length} notices:
              </span>

              {search && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                  Search: &quot;{search}&quot;
                  <XIcon className="size-3 cursor-pointer" onClick={() => setSearch("")} />
                </Badge>
              )}

              {selectedType !== "ALL" && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                  Category: {typeLabel(selectedType)}
                  <XIcon className="size-3 cursor-pointer" onClick={() => setSelectedType("ALL")} />
                </Badge>
              )}

              {mode === "manage" && selectedStatus !== "ALL" && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                  Status: {typeLabel(selectedStatus)}
                  <XIcon className="size-3 cursor-pointer" onClick={() => setSelectedStatus("ALL")} />
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcwIcon className="size-3" />
              <span>Clear All</span>
            </Button>
          </div>
        )}
      </div>

      {filteredAnnouncements.length === 0 ? (
        <EmptyState
          title={isFilterActive ? "No matching announcements found" : "No announcements found"}
          description={
            isFilterActive
              ? "Try adjusting your search criteria, category pill selection, or clearing active filters."
              : mode === "feed"
                ? "Company notices shared with you will show up here."
                : "Draft or publish an announcement to get started."
          }
          action={
            isFilterActive
              ? { label: "Reset Filters", onClick: resetFilters }
              : undefined
          }
        />
      ) : mode === "feed" ? (
        <div className="space-y-3.5">
          {filteredAnnouncements.map((announcement) => {
            const unread = !announcement.my_read;
            const needsAck =
              announcement.acknowledgement_required && !announcement.my_read?.acknowledged;

            return (
              <button
                key={announcement.id}
                type="button"
                onClick={() => setSelected(announcement)}
                className={`group w-full rounded-2xl border transition-all text-left p-5 shadow-xs hover:shadow-sm ${
                  unread
                    ? "border-primary/40 bg-primary/5 hover:border-primary/60"
                    : "border-border/70 bg-card hover:border-border"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2 py-0.5 font-medium flex items-center gap-1.5 ${categoryBadgeStyle(
                          announcement.type,
                        )}`}
                      >
                        <CategoryIcon type={announcement.type} />
                        <span>{typeLabel(announcement.type)}</span>
                      </Badge>

                      {unread && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0 animate-pulse">
                          New Notice
                        </Badge>
                      )}

                      {needsAck && (
                        <Badge variant="destructive" className="text-[10px] px-2 py-0 flex items-center gap-1">
                          <AlertCircleIcon className="size-3" />
                          Ack Required
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                      {announcement.title}
                    </h3>

                    <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                      {announcement.content}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 text-xs text-muted-foreground pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="size-3 text-muted-foreground" />
                      {formatDate(announcement.published_at ?? announcement.created_at)}
                    </span>
                    {announcement.created_by && (
                      <span className="text-[11px] text-muted-foreground">
                        by {announcement.created_by.name}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[35%]">Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnnouncements.map((announcement) => (
                <TableRow key={announcement.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-bold text-foreground text-sm flex items-center gap-2">
                        <span>{announcement.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {announcement.content}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-normal flex items-center gap-1.5 w-fit ${categoryBadgeStyle(
                        announcement.type,
                      )}`}
                    >
                      <CategoryIcon type={announcement.type} />
                      <span>{typeLabel(announcement.type)}</span>
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {typeLabel(announcement.audience_type)}
                  </TableCell>

                  <TableCell>
                    <StatusChip tone={STATUS_TONE[announcement.status]}>
                      {typeLabel(announcement.status)}
                    </StatusChip>
                  </TableCell>

                  <TableCell className="font-mono text-xs">
                    {announcement.status === "DRAFT" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <span>{announcement.read_count ?? 0} reads</span>
                        </div>
                        {announcement.acknowledgement_required && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                            {announcement.acknowledged_count ?? 0} acknowledged
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setSelected(announcement)}
                        title="Preview announcement"
                      >
                        <EyeIcon className="size-4 text-muted-foreground" />
                      </Button>

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
      )}

      <AnnouncementDetailDialog announcement={selected} onClose={() => setSelected(null)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => !next && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.title ?? "announcement"}"?`}
        description="This permanently removes the draft. Published announcements are a record of what people were shown and can't be deleted."
        confirmLabel="Delete Draft"
        destructive
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteAnnouncement.mutateAsync(pendingDelete.id);
          toast.success("Draft deleted successfully");
        }}
      />
    </div>
  );
}
