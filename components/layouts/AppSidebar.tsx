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
  LayoutDashboardIcon,
  MegaphoneIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// Each feature module (docs/PRD.md §6.3) adds its own entry here once it
// ships. TODO(later phase): gate these by the caller's resolved permissions
// (can(), lib/permissions.ts) rather than showing every link to everyone.
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
    label: "Configuration",
    items: [{ label: "Settings", href: "/settings", icon: SettingsIcon }],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2 py-1.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground">
            A
          </span>
          <span className="font-heading text-sm font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Agency HRM
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(pathname, item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
