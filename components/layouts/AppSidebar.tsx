"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlarmClockIcon,
  Building2Icon,
  CalendarCheckIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ClockIcon,
  FileBarChartIcon,
  ScrollTextIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersIcon,
  WalletIcon,
  SparklesIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { canAny } from "@/lib/permissions";
import { proxyMedia } from "@/lib/media";
import { permissionsForPath } from "@/lib/nav-permissions";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// A link shows only when the caller holds a permission for its route
// (lib/nav-permissions.ts). The Dashboard has no gate. Display-only — the
// API enforces every real check.
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboardIcon }],
  },
  {
    label: "People",
    items: [
      { label: "Employees", href: "/employees", icon: UsersIcon },
      { label: "Departments & Teams", href: "/departments", icon: Building2Icon },
      { label: "Attendance", href: "/attendance", icon: CalendarCheckIcon },
      { label: "Leave", href: "/leave", icon: CalendarClockIcon },
      { label: "Overtime", href: "/overtime", icon: AlarmClockIcon },
      { label: "Payroll", href: "/payroll", icon: WalletIcon },
    ],
  },
  {
    label: "Scheduling",
    items: [
      { label: "Shifts", href: "/shifts", icon: ClockIcon },
      { label: "Holidays", href: "/holidays", icon: CalendarDaysIcon },
    ],
  },
  {
    label: "Communication",
    items: [{ label: "Announcements", href: "/announcements", icon: MegaphoneIcon }],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", href: "/reports", icon: FileBarChartIcon },
      { label: "Audit log", href: "/audit", icon: ScrollTextIcon },
    ],
  },
  {
    label: "You",
    items: [{ label: "My profile", href: "/account", icon: UserRoundIcon }],
  },
  {
    label: "Configuration",
    items: [
      { label: "Roles", href: "/roles", icon: ShieldCheckIcon },
      { label: "System settings", href: "/settings", icon: SettingsIcon },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  // The Dashboard link points at "/", but its two sub-routes
  // (/dashboard/me, /dashboard/manage) belong to it too.
  if (href === "/") return pathname === "/" || pathname.startsWith("/dashboard");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const logoUrl = proxyMedia(user.organization.logo_url);
  const appTitle = user.organization.app_title;

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const required = permissionsForPath(item.href);
      return !required || canAny(user.permissions, required);
    }),
  })).filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl p-1.5 transition-opacity hover:opacity-90">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- small branded asset, no next/image config in this app
            <img src={logoUrl} alt="" className="size-9 shrink-0 rounded-xl object-contain" />
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 font-heading text-base font-extrabold text-primary-foreground shadow-md shadow-primary/20">
              <SparklesIcon className="size-5 text-white" />
            </div>
          )}
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-base font-extrabold tracking-tight text-sidebar-foreground">
              {appTitle}
            </span>
            {user.organization.name !== appTitle && (
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                {user.organization.name}
              </span>
            )}
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-1">
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase px-2 py-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className={`group relative flex h-9.5 items-center gap-3 rounded-xl px-3 text-xs font-medium transition-all duration-200 ${
                          active
                            ? "bg-primary! text-primary-foreground! font-semibold shadow-xs shadow-primary/25 hover:bg-primary/90!"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <Link href={item.href}>
                          <item.icon className={`size-4 transition-transform group-hover:scale-110 ${active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
        <Link
          href="/account"
          className="flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-2.5 transition-colors hover:bg-sidebar-accent/60"
        >
          <Avatar className="size-7.5 rounded-lg">
            <AvatarImage src={proxyMedia(user.photo_url)} alt={user.name} className="rounded-lg" />
            <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-sidebar-foreground">{user.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
          </div>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}

