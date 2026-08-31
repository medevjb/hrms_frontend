"use client";

import {
  AwardIcon,
  BriefcaseIcon,
  DownloadIcon,
  FileTextIcon,
  FolderIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import {
  documentDownloadUrl,
  documentPreviewUrl,
  useEmployeeDocuments,
} from "@/services/documents";
import type { DocumentCategory } from "@/types/documents";

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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MyDocumentsTab({ employeeId }: { employeeId: number }) {
  const { data: documents, isLoading } = useEmployeeDocuments(employeeId);

  if (isLoading) return <PageLoadingSkeleton />;

  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
        <div className="rounded-full bg-muted p-3">
          <FolderIcon className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No documents yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Contracts, identification, and certifications your HR team files for you will show up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
            <CategoryIcon category={doc.category} />
          </div>
          <div className="min-w-0 flex-1">
            <a
              href={documentPreviewUrl(doc.id)}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
            >
              {doc.title}
            </a>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
                {label(doc.category)}
              </Badge>
              <span>{formatSize(doc.size_bytes)}</span>
              {doc.uploaded_at && (
                <span>· Added {new Date(doc.uploaded_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="size-8 shrink-0" asChild>
            <a href={documentDownloadUrl(doc.id)} target="_blank" rel="noreferrer" title="Download">
              <DownloadIcon className="size-4 text-muted-foreground" />
            </a>
          </Button>
        </li>
      ))}
    </ul>
  );
}
