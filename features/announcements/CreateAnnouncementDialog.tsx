"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-error";
import { useCreateAnnouncement } from "@/services/announcements";
import { useDepartments } from "@/services/departments";
import { useEmployees } from "@/services/employees";
import { useTeams } from "@/services/teams";
import type { AnnouncementAudienceType, AnnouncementType } from "@/types/announcements";

const TYPES: AnnouncementType[] = [
  "GENERAL",
  "HR_NOTICE",
  "HOLIDAY",
  "PAYROLL",
  "POLICY",
  "EMERGENCY",
  "TEAM",
];

const AUDIENCES: AnnouncementAudienceType[] = ["ALL", "DEPARTMENT", "TEAM", "SELECTED"];

function label(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

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

  if (audience === "ALL") return null;

  const options =
    audience === "DEPARTMENT"
      ? (departments.data ?? []).map((d) => ({ id: d.id, name: d.name }))
      : audience === "TEAM"
        ? (teams.data ?? []).map((t) => ({ id: t.id, name: t.name }))
        : (employees.data?.data ?? []).map((e) => ({ id: e.id, name: e.full_name }));

  return (
    <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
      {options.length === 0 && <p className="text-sm text-muted-foreground">Nothing to choose from.</p>}
      {options.map((option) => (
        <label key={option.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={selected.includes(option.id)}
            onCheckedChange={() => onToggle(option.id)}
          />
          {option.name}
        </label>
      ))}
    </div>
  );
}

function Form({ onClose }: { onClose: () => void }) {
  const create = useCreateAnnouncement();

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    try {
      await create.mutateAsync({
        type,
        title,
        content,
        audience_type: audience,
        targets: audience === "ALL" ? undefined : targets,
        acknowledgement_required: ackRequired,
        publish_at: publishAt,
        expires_at: expiresAt,
      });
      toast.success("Draft created");
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Type">
          <Select value={type} onValueChange={(v) => setType(v as AnnouncementType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {label(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Audience">
          <Select value={audience} onValueChange={(v) => setAudience(v as AnnouncementAudienceType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIENCES.map((value) => (
                <SelectItem key={value} value={value}>
                  {label(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {audience !== "ALL" && (
        <FormField label="Recipients" error={fieldErrors.targets}>
          <TargetPicker audience={audience} selected={targets} onToggle={toggleTarget} />
        </FormField>
      )}

      <FormField label="Title" htmlFor="announcement_title" error={fieldErrors.title}>
        <Input
          id="announcement_title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Content" htmlFor="announcement_content" error={fieldErrors.content}>
        <Textarea
          id="announcement_content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          required
        />
      </FormField>

      <div className="flex items-center gap-2">
        <Switch
          id="announcement_ack"
          checked={ackRequired}
          onCheckedChange={setAckRequired}
        />
        <label htmlFor="announcement_ack" className="text-sm font-medium">
          Require acknowledgement
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Publish at" description="Optional — leave blank to publish manually">
          <DateTimePicker value={publishAt} onChange={setPublishAt} />
        </FormField>
        <FormField label="Expires at" description="Optional" error={fieldErrors.expires_at}>
          <DateTimePicker value={expiresAt} onChange={setExpiresAt} />
        </FormField>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={create.isPending || !title || !content}>
          Save draft
        </Button>
      </DialogFooter>
    </form>
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
        </DialogHeader>
        {opened && <Form key="create-announcement" onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
