import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { can } from "@/lib/permissions";
import type { DashboardPayload } from "@/types/dashboard";

export function AnnouncementsPanel({
  announcements,
}: {
  announcements: NonNullable<DashboardPayload["widgets"]["announcements"]>;
}) {
  const user = useCurrentUser();

  return (
    <Card className="border-border/70 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Announcements
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {announcements.unread > 0 ? `${announcements.unread} unread` : "Recent posts"}
          </p>
        </div>
        {can(user.permissions, "announcement.create") && (
          <Link
            href="/announcements"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <PlusIcon className="size-3.5" /> New
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {announcements.recent.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
            Nothing posted yet.
          </p>
        ) : (
          announcements.recent.map((ann) => (
            <Link
              key={ann.id}
              href="/announcements"
              className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 p-3 transition-all hover:border-primary/40 hover:bg-muted/40 group"
            >
              <div className="flex items-center justify-between">
                <StatusChip tone={ann.type === "URGENT" ? "danger" : "info"}>
                  {ann.type.replace(/_/g, " ")}
                </StatusChip>
                {ann.published_at && (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {new Date(ann.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {ann.title}
              </p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
