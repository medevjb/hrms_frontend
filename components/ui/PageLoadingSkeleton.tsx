import { Skeleton, Stack } from "@mantine/core";

export function PageLoadingSkeleton() {
  return (
    <Stack gap="md">
      <Skeleton height={28} width="30%" radius="sm" />
      <Skeleton height={16} width="50%" radius="sm" />
      <Skeleton height={200} radius="md" mt="sm" />
    </Stack>
  );
}
