"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { canAny } from "@/lib/permissions";
import { permissionsForPath } from "@/lib/nav-permissions";

/**
 * A soft gate over the shell's page area: if the caller lands on a section
 * they hold no permission for (a bookmarked link, a stale tab), show a
 * clear message instead of a page that just fails its API calls. The API
 * is still the real boundary.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const required = permissionsForPath(pathname);

  if (required && !canAny(user.permissions, required)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <LockIcon className="size-5" />
        </div>
        <div className="space-y-1">
          <h1 className="font-heading text-lg font-semibold text-foreground">
            You don&apos;t have access to this page
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your role doesn&apos;t include this area. If you think that&apos;s wrong, ask your HR
            team.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
