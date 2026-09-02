"use client";

import { useState } from "react";
import {
  AlertTriangleIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  DollarSignIcon,
  EyeIcon,
  FileTextIcon,
  MegaphoneIcon,
  SearchIcon,
  SendIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api-error";
import {
  useCreateAnnouncement,
  usePublishAnnouncement,
  useUpdateAnnouncement,
} from "@/services/announcements";
import { useDepartments } from "@/services/departments";
import { useEmployees } from "@/services/employees";
import { useTeams } from "@/services/teams";
import type {
  Announcement,
  AnnouncementAudienceType,
  AnnouncementType,
} from "@/types/announcements";

const TYPES: {
  value: AnnouncementType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "GENERAL", label: "General", icon: MegaphoneIcon },
  { value: "HR_NOTICE", label: "HR notice", icon: BriefcaseIcon },
  { value: "POLICY", label: "Policy", icon: ShieldCheckIcon },
  { value: "EMERGENCY", label: "Emergency", icon: AlertTriangleIcon },
  { value: "HOLIDAY", label: "Holiday", icon: CalendarIcon },
  { value: "PAYROLL", label: "Payroll", icon: DollarSignIcon },
  { value: "TEAM", label: "Team", icon: UsersIcon },
];

const AUDIENCES: { value: AnnouncementAudienceType; label: string; desc: string }[] = [
  { value: "ALL", label: "Entire company", desc: "Everyone in the organization" },
  { value: "DEPARTMENT", label: "Departments", desc: "One or more departments" },
  { value: "TEAM", label: "Teams", desc: "Specific operational teams" },
  { value: "SELECTED", label: "Selected people", desc: "Individual employees" },
];

function TargetPicker({
  audience,
  selected,
  onToggle,
}: {
  audience: AnnouncementAudienceType;
  selected: number[];
  onToggle: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 250);

  const departments = useDepartments();
  const teams = useTeams();
  // Employees are searched server-side; departments and teams are short
  // lists filtered in place.
  const employees = useEmployees({
    search: audience === "SELECTED" ? debouncedSearch || undefined : undefined,
    sort: "name",
    per_page: 25,
  });

  if (audience === "ALL") return null;

  const rawOptions =
    audience === "DEPARTMENT"
      ? (departments.data ?? []).map((d) => ({ id: d.id, name: d.name }))
      : audience === "TEAM"
        ? (teams.data ?? []).map((t) => ({ id: t.id, name: t.name }))
        : (employees.data?.data ?? []).map((e) => ({
            id: e.id,
            name: `${e.full_name} (${e.designation})`,
          }));

  const options =
    audience === "SELECTED" || !search.trim()
      ? rawOptions
      : rawOptions.filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-2.5">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter recipients"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-background pl-8"
        />
      </div>

      <div className="max-h-40 space-y-0.5 overflow-y-auto pr-1">
        {options.length === 0 && (
          <p className="py-3 text-center text-xs text-muted-foreground">No matching recipients.</p>
        )}
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
                checked ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-muted"
              }`}
            >
              <Checkbox checked={checked} onCheckedChange={() => onToggle(option.id)} />
              <span className="truncate">{option.name}</span>
            </label>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          {selected.length} selected
        </p>
      )}
    </div>
  );
}

function typeLabel(type: string): string {
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function Form({
  announcement,
  onClose,
}: {
  announcement?: Announcement;
  onClose: () => void;
}) {
  const user = useCurrentUser();
  const canPublish = user.permissions.includes("announcement.publish");
  const isEdit = Boolean(announcement);

  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement(announcement?.id ?? 0);
  const publish = usePublishAnnouncement(announcement?.id);
  const saving = create.isPending || update.isPending || publish.isPending;

  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [type, setType] = useState<AnnouncementType>(announcement?.type ?? "GENERAL");
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [content, setContent] = useState(announcement?.content ?? "");
  const [audience, setAudience] = useState<AnnouncementAudienceType>(
    announcement?.audience_type ?? "ALL",
  );
  const [targets, setTargets] = useState<number[]>(
    announcement?.targets?.map((t) => t.target_id) ?? [],
  );
  const [ackRequired, setAckRequired] = useState(announcement?.acknowledgement_required ?? false);
  const [publishAt, setPublishAt] = useState<string | null>(announcement?.publish_at ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(announcement?.expires_at ?? null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function toggleTarget(id: number) {
    setTargets((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function handleSave(publishNow: boolean) {
    setFieldErrors({});

    const payload = {
      type,
      title,
      content,
      audience_type: audience,
      targets: audience === "ALL" ? undefined : targets,
      acknowledgement_required: ackRequired,
      publish_at: publishAt,
      expires_at: expiresAt,
    };

    try {
      const saved = isEdit
        ? await update.mutateAsync(payload)
        : await create.mutateAsync(payload);

      if (publishNow && canPublish && saved?.id) {
        await publish.mutateAsync(saved.id);
        toast.success(isEdit ? "Announcement published" : "Announcement created and published");
      } else {
        toast.success(isEdit ? "Changes saved" : "Draft saved");
      }
      onClose();
    } catch (caught) {
      // The failure toast is fired by the global mutation handler; here we
      // only fan the server's field errors out under their inputs.
      if (caught instanceof ApiError) {
        setFieldErrors(
          Object.fromEntries(Object.entries(caught.errors ?? {}).map(([f, m]) => [f, m[0]])),
        );
      }
    }
  }

  const canSubmit = title.trim() !== "" && content.trim() !== "" && !saving;

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "edit" | "preview")}>
        <TabsList className="w-full">
          <TabsTrigger value="edit">
            <FileTextIcon />
            Compose
          </TabsTrigger>
          <TabsTrigger value="preview">
            <EyeIcon />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4 space-y-4">
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TYPES.map((option) => {
                const Icon = option.icon;
                const isSelected = type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/70 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{option.label}</span>
                    {isSelected && <CheckIcon className="ml-auto size-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <FormField
            label="Audience"
            description={AUDIENCES.find((a) => a.value === audience)?.desc}
          >
            <Select value={audience} onValueChange={(v) => setAudience(v as AnnouncementAudienceType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {audience !== "ALL" && (
            <FormField label="Recipients" error={fieldErrors.targets}>
              <TargetPicker audience={audience} selected={targets} onToggle={toggleTarget} />
            </FormField>
          )}

          <FormField label="Title" htmlFor="announcement_title" error={fieldErrors.title}>
            <Input
              id="announcement_title"
              placeholder="e.g. Q3 townhall and office holiday notice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Message" htmlFor="announcement_content" error={fieldErrors.content}>
            <Textarea
              id="announcement_content"
              placeholder="Write the notice here…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
          </FormField>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="announcement_ack" className="cursor-pointer">
                Require acknowledgement
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Recipients must confirm they&apos;ve read it.
              </p>
            </div>
            <Switch id="announcement_ack" checked={ackRequired} onCheckedChange={setAckRequired} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Publish on" description="Optional — leave blank to publish manually">
              <DateTimePicker value={publishAt} onChange={setPublishAt} />
            </FormField>
            <FormField
              label="Expires on"
              description="Optional — hides after this date"
              error={fieldErrors.expires_at}
            >
              <DateTimePicker value={expiresAt} onChange={setExpiresAt} />
            </FormField>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div className="rounded-xl border border-border/70 bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
              <Badge variant="outline" className="gap-1.5">
                <MegaphoneIcon className="size-3.5 text-primary" />
                {typeLabel(type)}
              </Badge>
              {ackRequired && (
                <Badge variant="destructive" className="text-[11px]">
                  Acknowledgement required
                </Badge>
              )}
            </div>

            <h2 className="mt-3 text-lg leading-tight font-semibold text-foreground">
              {title || "Untitled announcement"}
            </h2>

            <div className="mt-3 min-h-[120px] rounded-lg border border-border/50 bg-muted/20 p-3 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
              {content || "No message written yet."}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
              <span>Audience: {typeLabel(audience)}</span>
              <span>By {user.name}</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canSubmit}
          onClick={() => handleSave(false)}
        >
          {isEdit ? "Save changes" : "Save draft"}
        </Button>
        {canPublish && (
          <Button type="button" disabled={!canSubmit} onClick={() => handleSave(true)}>
            <SendIcon className="size-3.5" />
            Publish
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export function SaveAnnouncementDialog({
  opened,
  onClose,
  announcement,
}: {
  opened: boolean;
  onClose: () => void;
  announcement?: Announcement;
}) {
  const isEdit = Boolean(announcement);

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MegaphoneIcon className="size-5 text-primary" />
            {isEdit ? "Edit announcement" : "Create announcement"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this draft before it goes out."
              : "Draft or publish a broadcast to employees, departments, or teams."}
          </DialogDescription>
        </DialogHeader>
        {opened && (
          <Form
            key={announcement?.id ?? "new"}
            announcement={announcement}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
