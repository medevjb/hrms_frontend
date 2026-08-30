"use client";

import { useRef, useState } from "react";
import { FileTextIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { ApiError } from "@/lib/api-error";
import {
  documentDownloadUrl,
  useDeleteDocument,
  useEmployeeDocuments,
  useUploadDocument,
} from "@/services/documents";
import type { DocumentCategory } from "@/types/documents";

const CATEGORIES: DocumentCategory[] = [
  "CONTRACT",
  "IDENTIFICATION",
  "CERTIFICATION",
  "PERFORMANCE",
  "OTHER",
];

function label(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function UploadDialog({
  employeeId,
  opened,
  onClose,
}: {
  employeeId: number;
  opened: boolean;
  onClose: () => void;
}) {
  const upload = useUploadDocument(employeeId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("CONTRACT");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file.");
      return;
    }
    try {
      await upload.mutateAsync({ title, category, file });
      toast.success("Document uploaded");
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Upload failed.");
    }
  }

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <FormField label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label="Category">
            <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {label(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="File" description="PDF, image, or Word — up to 10 MB">
            <Input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" required />
          </FormField>
          <DialogFooter>
            <Button type="submit" disabled={upload.isPending || !title}>
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EmployeeDocumentsSection({ employeeId }: { employeeId: number }) {
  const user = useCurrentUser();
  const canView =
    user.permissions.includes("document.view") || user.permissions.includes("document.manage");
  const canManage = user.permissions.includes("document.manage");
  const { data: documents, isLoading } = useEmployeeDocuments(employeeId);
  const del = useDeleteDocument(employeeId);
  const [uploading, setUploading] = useState(false);

  if (!canView) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        {canManage && (
          <Button variant="outline" size="sm" onClick={() => setUploading(true)}>
            Upload
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !documents || documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents on file.</p>
        ) : (
          <ul className="divide-y divide-border">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between py-2 text-sm">
                <a
                  href={documentDownloadUrl(document.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:underline"
                >
                  <FileTextIcon className="size-4 text-muted-foreground" />
                  <span>
                    {document.title}
                    <span className="ml-2 text-xs text-muted-foreground">{label(document.category)}</span>
                  </span>
                </a>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={del.isPending}
                    onClick={async () => {
                      try {
                        await del.mutateAsync(document.id);
                        toast.success("Document deleted");
                      } catch {
                        toast.error("Could not delete");
                      }
                    }}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {canManage && (
        <UploadDialog employeeId={employeeId} opened={uploading} onClose={() => setUploading(false)} />
      )}
    </Card>
  );
}
