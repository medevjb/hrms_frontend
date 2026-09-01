"use client";

import { useState } from "react";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircle2Icon,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ApiError } from "@/lib/api-error";
import { useCreateAnnouncement, usePublishAnnouncement } from "@/services/announcements";
import { useDepartments } from "@/services/departments";
import { useEmployees } from "@/services/employees";
import { useTeams } from "@/services/teams";
import type { AnnouncementAudienceType, AnnouncementType } from "@/types/announcements";

const TYPES: { value: AnnouncementType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: "GENERAL", label: "General", icon: MegaphoneIcon, color: "border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-900/40 dark:text-slate-300" },
  { value: "HR_NOTICE", label: "HR Notice", icon: BriefcaseIcon, color: "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "POLICY", label: "Policy", icon: ShieldCheckIcon, color: "border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-900/40 dark:text-purple-300" },
  { value: "EMERGENCY", label: "Emergency", icon: AlertTriangleIcon, color: "border-red-300 text-red-700 bg-red-50 dark:bg-red-900/40 dark:text-red-300" },
  { value: "HOLIDAY", label: "Holiday", icon: CalendarIcon, color: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { value: "PAYROLL", label: "Payroll", icon: DollarSignIcon, color: "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/40 dark:text-amber-300" },
  { value: "TEAM", label: "Team", icon: UsersIcon, color: "border-indigo-300 text-indigo-700 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-300" },
];

const AUDIENCES: { value: AnnouncementAudienceType; label: string; desc: string }[] = [
  { value: "ALL", label: "Entire Company", desc: "Broadcast notice to all employees across the organization" },
  { value: "DEPARTMENT", label: "Specific Departments", desc: "Target one or multiple departments" },
  { value: "TEAM", label: "Specific Teams", desc: "Target operational or functional teams" },
  { value: "SELECTED", label: "Selected Employees", desc: "Target individual employees directly" },
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
  const departments = useDepartments();
  const teams = useTeams();
  const employees = useEmployees({});
  const [search, setSearch] = useState("");

  if (audience === "ALL") return null;

  const rawOptions =
    audience === "DEPARTMENT"
      ? (departments.data ?? []).map((d) => ({ id: d.id, name: d.name }))
      : audience === "TEAM"
        ? (teams.data ?? []).map((t) => ({ id: t.id, name: t.name }))
        : (employees.data?.data ?? []).map((e) => ({ id: e.id, name: `${e.full_name} (${e.designation})` }));

  const options = search.trim()
    ? rawOptions.filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()))
    : rawOptions;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter target recipients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 text-xs bg-background"
        />
      </div>

      <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
        {options.length === 0 && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            No matching recipients found.
          </p>
        )}
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={`flex items-center justify-between rounded-lg p-2 text-xs font-medium cursor-pointer transition-colors ${
                checked ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Checkbox checked={checked} onCheckedChange={() => onToggle(option.id)} />
                <span className="truncate">{option.name}</span>
              </div>
              {checked && <CheckCircle2Icon className="size-3.5 text-primary flex-shrink-0" />}
            </label>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          <span>{selected.length} recipient(s) selected</span>
        </div>
      )}
    </div>
  );
}

function Form({ onClose }: { onClose: () => void }) {
  const user = useCurrentUser();
  const canPublish = user.permissions.includes("announcement.publish");
  const create = useCreateAnnouncement();
  const publishMutation = usePublishAnnouncement(0);

  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [type, setType] = useState<AnnouncementType>("GENERAL");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudienceType>("ALL");
  const [targets, setTargets] = useState<number[]>([]);
  const [ackRequired, setAckRequired] = useState(false);
  const [publishAt, setPublishAt] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function toggleTarget(id: number) {
    setTargets((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function handleSave(shouldPublishDirectly: boolean) {
    setError(null);
    setFieldErrors({});

    try {
      const created = await create.mutateAsync({
        type,
        title,
        content,
        audience_type: audience,
        targets: audience === "ALL" ? undefined : targets,
        acknowledgement_required: ackRequired,
        publish_at: publishAt,
        expires_at: expiresAt,
      });

      if (shouldPublishDirectly && created?.id && canPublish) {
        await publishMutation.mutateAsync();
        toast.success("Announcement created and published!");
      } else {
        toast.success("Draft announcement saved");
      }
      onClose();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(
          Object.fromEntries(Object.entries(caught.errors ?? {}).map(([f, m]) => [f, m[0]])),
        );
        setError(caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="space-y-4 pt-1">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "edit" | "preview")}>
        <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1 border border-border">
          <TabsTrigger value="edit" className="gap-2 text-xs font-medium">
            <FileTextIcon className="size-3.5" />
            Compose Announcement
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2 text-xs font-medium">
            <EyeIcon className="size-3.5" />
            Live Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4 pt-3">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Announcement Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? `${t.color} border-2 shadow-xs font-semibold ring-1 ring-primary/20`
                        : "border-border/70 bg-card hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <FormField label="Audience Scope">
            <Select value={audience} onValueChange={(v) => setAudience(v as AnnouncementAudienceType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-[11px] text-muted-foreground">{option.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {audience !== "ALL" && (
            <FormField label="Target Recipients" error={fieldErrors.targets}>
              <TargetPicker audience={audience} selected={targets} onToggle={toggleTarget} />
            </FormField>
          )}

          <FormField label="Announcement Title" htmlFor="announcement_title" error={fieldErrors.title}>
            <Input
              id="announcement_title"
              placeholder="e.g. Q3 Company Townhall & Office Holiday Notice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Content Body" htmlFor="announcement_content" error={fieldErrors.content}>
            <Textarea
              id="announcement_content"
              placeholder="Write the detailed message here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
            />
          </FormField>

          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-muted/30">
            <Switch
              id="announcement_ack"
              checked={ackRequired}
              onCheckedChange={setAckRequired}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <label htmlFor="announcement_ack" className="text-xs font-semibold text-foreground cursor-pointer">
                Require Employee Acknowledgement
              </label>
              <p className="text-[11px] text-muted-foreground">
                Recipients must click an &quot;I Acknowledge&quot; button when viewing this notice.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Scheduled Publish Date" description="Optional — leave blank to publish manually">
              <DateTimePicker value={publishAt} onChange={setPublishAt} />
            </FormField>
            <FormField label="Expiration Date" description="Optional — notice hides after expiry" error={fieldErrors.expires_at}>
              <DateTimePicker value={expiresAt} onChange={setExpiresAt} />
            </FormField>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="pt-3 space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs font-medium gap-1.5 py-1 px-2.5">
                <MegaphoneIcon className="size-3.5 text-primary" />
                <span>{type}</span>
              </Badge>
              {ackRequired && (
                <Badge variant="destructive" className="text-xs">
                  Acknowledgement Required
                </Badge>
              )}
            </div>

            <h2 className="text-xl font-bold text-foreground">
              {title || "Untitled Announcement"}
            </h2>

            <div className="whitespace-pre-line text-sm text-foreground/90 leading-relaxed min-h-[120px] p-4 rounded-xl bg-muted/20 border border-border/50">
              {content || "No announcement content written yet..."}
            </div>

            <div className="text-xs text-muted-foreground flex items-center justify-between pt-2 border-t border-border/60">
              <span>Audience: {audience}</span>
              <span>Author: {user.name}</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={create.isPending || !title.trim() || !content.trim()}
            onClick={() => handleSave(false)}
          >
            {create.isPending ? "Saving..." : "Save Draft"}
          </Button>

          {canPublish && (
            <Button
              type="button"
              disabled={create.isPending || !title.trim() || !content.trim()}
              onClick={() => handleSave(true)}
              className="gap-1.5"
            >
              <SendIcon className="size-3.5" />
              <span>Publish Now</span>
            </Button>
          )}
        </div>
      </DialogFooter>
    </div>
  );
}

export function CreateAnnouncementDialog({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MegaphoneIcon className="size-5 text-primary" />
            Create Announcement
          </DialogTitle>
          <DialogDescription className="text-xs">
            Draft or publish official broadcasts to employees or specific departments/teams.
          </DialogDescription>
        </DialogHeader>
        {opened && <Form key="create-announcement" onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
