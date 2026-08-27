import { Button, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconInboxOff } from "@tabler/icons-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Stack align="center" gap="sm" py="xl">
      <ThemeIcon size={48} radius="xl" variant="light" color="gray">
        {icon ?? <IconInboxOff size={24} />}
      </ThemeIcon>
      <Title order={4}>{title}</Title>
      {description && (
        <Text c="dimmed" size="sm" ta="center" maw={360}>
          {description}
        </Text>
      )}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </Stack>
  );
}
