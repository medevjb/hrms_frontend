"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/**
 * An active/inactive toggle for a table row. Flipping it opens a
 * confirmation (same as delete) before calling `onConfirm(next)`.
 */
export function StatusSwitch({
  checked,
  onConfirm,
  entityLabel = "this item",
  disabled,
}: {
  checked: boolean;
  onConfirm: (next: boolean) => void | Promise<void>;
  entityLabel?: string;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState<boolean | null>(null);

  return (
    <>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => setPending(next)}
        aria-label={checked ? "Deactivate" : "Activate"}
      />
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending ? `Activate ${entityLabel}?` : `Deactivate ${entityLabel}?`}
        description={
          pending
            ? `${entityLabel} will become active and available for use.`
            : `${entityLabel} will be hidden from new selections. Existing records that already reference it are unaffected.`
        }
        confirmLabel={pending ? "Activate" : "Deactivate"}
        onConfirm={async () => {
          if (pending !== null) await onConfirm(pending);
          setPending(null);
        }}
      />
    </>
  );
}
