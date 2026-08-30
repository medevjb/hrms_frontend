"use client";

import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The action bar that appears once one or more rows are selected. Sits
 * above the table; hosts bulk actions (delete, activate, deactivate).
 */
export function BulkBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Clear selection" className="ml-auto">
        <XIcon />
      </Button>
    </div>
  );
}

/**
 * Runs the same mutation over a list of ids, tolerating per-item failures
 * (e.g. a "block when in use" 409), and returns a summary for a toast.
 */
export async function runBulk<T>(
  ids: number[],
  action: (id: number) => Promise<T>,
): Promise<{ ok: number; failed: number }> {
  const results = await Promise.allSettled(ids.map(action));
  const ok = results.filter((r) => r.status === "fulfilled").length;
  return { ok, failed: results.length - ok };
}
