"use client";

import { useRef, useState } from "react";
import {
  AwardIcon,
  BriefcaseIcon,
  DownloadIcon,
  FileTextIcon,
  FolderIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
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

function CategoryIcon({ category }: { category: DocumentCategory }) {
  switch (category) {
    case "CONTRACT":
      return <BriefcaseIcon className="size-4 text-blue-500" />;
    case "IDENTIFICATION":
      return <ShieldCheckIcon className="size-4 text-purple-500" />;
    case "CERTIFICATION":
      return <AwardIcon className="size-4 text-amber-500" />;
    case "PERFORMANCE":
      return <FileTextIcon className="size-4 text-emerald-500" />;
    default:
      return <FolderIcon className="size-4 text-slate-500" />;
  }
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

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    upload.mutate(
      { title, category, file },
      {
        onSuccess: () => {
          toast.success("Document uploaded successfully");
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadIcon className="size-5 text-primary" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Add contracts, IDs, or certifications to this employee&apos;s record.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <FormField label="Document Title">
            <Input
              placeholder="e.g. Employment Contract 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Category">
            <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon category={option} />
                      <span>{label(option)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="File Attachment" description="PDF, Images, or Word documents (up to 10 MB)">
            <Input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" required />
          </FormField>
          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={upload.isPending || !title}>
              {upload.isPending ? "Uploading..." : "Upload Document"}
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
    <Card className="overflow-hidden border border-border shadow-sm">
      <CardHeader className="bg-muted/30 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderIcon className="size-4 text-blue-600 dark:text-blue-400" />
              Employee Documents
            </CardTitle>
            <CardDescription className="text-xs">
              Contracts, identification, certifications, and compliance documents.
            </CardDescription>
          </div>
          {canManage && (
            <Button size="sm" onClick={() => setUploading(true)}>
              <PlusIcon className="mr-1.5 size-3.5" />
              Upload Document
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-12 bg-muted/60 rounded-lg animate-pulse" />
            <div className="h-12 bg-muted/60 rounded-lg animate-pulse" />
          </div>
        ) : !documents || documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <div className="rounded-full bg-muted p-3">
              <FileTextIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No documents uploaded yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Upload contracts, NDAs, identification, or certifications for this employee.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2.5 rounded-lg bg-muted/60 flex-shrink-0">
                    <CategoryIcon category={doc.category} />
                  </div>
                  <div className="min-w-0">
                    <a
                      href={documentDownloadUrl(doc.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-foreground hover:text-primary hover:underline truncate block"
                    >
                      {doc.title}
                    </a>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                        {label(doc.category)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="size-8" asChild>
                    <a href={documentDownloadUrl(doc.id)} target="_blank" rel="noreferrer" title="Download">
                      <DownloadIcon className="size-4 text-muted-foreground group-hover:text-foreground" />
                    </a>
                  </Button>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      disabled={del.isPending}
                      onClick={() => {
                        del.mutate(doc.id, {
                          onSuccess: () => toast.success("Document deleted"),
                        });
                      }}
                      title="Delete document"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {canManage && (
        <UploadDialog employeeId={employeeId} opened={uploading} onClose={() => setUploading(false)} />
      )}
    </Card>
  );
}

