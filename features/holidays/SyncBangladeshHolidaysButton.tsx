"use client";

import { DownloadCloudIcon, Loader2Icon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useImportBangladeshHolidays } from "@/services/holidays";

/**
 * Pulls Bangladesh's standard public holidays from Google's public
 * calendar on demand. The backend also runs this weekly; this button is
 * for when Head HR wants the current year populated right now.
 */
export function SyncBangladeshHolidaysButton() {
  const user = useCurrentUser();
  const importHolidays = useImportBangladeshHolidays();

  if (!user.permissions.includes("holiday.manage")) {
    return null;
  }

  function sync() {
    importHolidays.mutate(undefined, {
      onSuccess: ({ created, updated, skipped }) => {
        if (created === 0 && updated === 0) {
          toast.success("Holidays are already up to date");
          return;
        }
        const parts = [
          created > 0 && `${created} added`,
          updated > 0 && `${updated} updated`,
          skipped > 0 && `${skipped} skipped`,
        ].filter(Boolean);
        toast.success(`Bangladesh holidays synced — ${parts.join(", ")}`);
      },
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={sync} disabled={importHolidays.isPending}>
      {importHolidays.isPending ? <Loader2Icon className="animate-spin" /> : <DownloadCloudIcon />}
      Sync Bangladesh holidays
    </Button>
  );
}
