"use client";

import Link from "next/link";
import { EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The standard per-row action cluster for every list table: view, edit,
 * delete. Pass an href for navigation-style actions or a handler for
 * modal-style ones; omit an action entirely to hide its icon.
 */
export function RowActions({
  viewHref,
  onView,
  editHref,
  onEdit,
  onDelete,
  deleteDisabled,
  deleteTitle,
}: {
  viewHref?: string;
  onView?: () => void;
  editHref?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  deleteTitle?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      {viewHref ? (
        <Button variant="ghost" size="icon-sm" asChild aria-label="View">
          <Link href={viewHref}>
            <EyeIcon />
          </Link>
        </Button>
      ) : onView ? (
        <Button variant="ghost" size="icon-sm" onClick={onView} aria-label="View">
          <EyeIcon />
        </Button>
      ) : null}

      {editHref ? (
        <Button variant="ghost" size="icon-sm" asChild aria-label="Edit">
          <Link href={editHref}>
            <PencilIcon />
          </Link>
        </Button>
      ) : onEdit ? (
        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit">
          <PencilIcon />
        </Button>
      ) : null}

      {onDelete && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          disabled={deleteDisabled}
          title={deleteTitle}
          aria-label="Delete"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon />
        </Button>
      )}
    </div>
  );
}
