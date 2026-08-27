"use client"; // Error boundaries must be Client Components

import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container size="sm" className="flex flex-1 items-center">
      <Stack align="center" gap="sm" py="xl">
        <Title order={2}>Something went wrong</Title>
        <Text c="dimmed" ta="center">
          An unexpected error occurred. You can try again, or come back
          later if the problem continues.
        </Text>
        <Button onClick={() => retry()}>Try again</Button>
      </Stack>
    </Container>
  );
}
