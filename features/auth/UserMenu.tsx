"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, LogOutIcon, SettingsIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { canAny } from "@/lib/permissions";
import { proxyMedia } from "@/lib/media";
import { permissionsForPath } from "@/lib/nav-permissions";

export function UserMenu() {
  const user = useCurrentUser();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const photoUrl = proxyMedia(user.photo_url);
  const canManageSettings = canAny(user.permissions, permissionsForPath("/settings") ?? []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  const roleText = user.roles && user.roles.length > 0 ? user.roles[0].replace(/_/g, " ") : "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2.5 rounded-full border border-border/60 bg-card px-2.5 py-1 text-sm outline-none transition-colors hover:border-border hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-7.5 border border-primary/20">
          {photoUrl && <AvatarImage src={photoUrl} alt="" />}
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="hidden flex-col items-start text-left md:flex">
          <span className="text-xs font-semibold text-foreground leading-tight">{user.name}</span>
          <span className="text-[10px] font-medium text-muted-foreground capitalize leading-tight">
            {roleText}
          </span>
        </div>
        <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-lg">
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{user.name}</p>
            <p className="text-xs text-muted-foreground leading-none">{user.email}</p>
            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-primary capitalize">
              <ShieldCheckIcon className="size-3" />
              <span>{roleText}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
          <Link href="/account">
            <UserRoundIcon className="size-4 mr-2" />
            <span>My profile</span>
          </Link>
        </DropdownMenuItem>
        {canManageSettings && (
          <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
            <Link href="/settings">
              <SettingsIcon className="size-4 mr-2" />
              <span>System settings</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={loggingOut} className="rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer">
          <LogOutIcon className="size-4 mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

