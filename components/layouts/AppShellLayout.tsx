"use client";

import {
  AppShell,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLayoutDashboard } from "@tabler/icons-react";
import { UserMenu } from "@/features/auth/UserMenu";

type NavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

// Placeholder nav — each feature module (docs/PRD.md §6.3) adds its own entry
// here once it ships, gated by the caller's resolved permissions.
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <IconLayoutDashboard size={18} /> },
];

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="sm"
            />
            <Text fw={600}>Agency HRM</Text>
          </Group>
          <UserMenu />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <AppShell.Section grow component={ScrollArea}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              leftSection={item.icon}
            />
          ))}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
