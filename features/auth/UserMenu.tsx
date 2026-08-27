"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconLogout } from "@tabler/icons-react";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";

export function UserMenu() {
  const user = useCurrentUser();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs">
            <Avatar radius="xl" size="sm">
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Text size="sm" fw={500}>
              {user.name}
            </Text>
            <IconChevronDown size={14} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconLogout size={16} />}
          onClick={handleLogout}
          disabled={loggingOut}
        >
          Log out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
