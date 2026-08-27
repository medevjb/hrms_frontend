import { Container } from "@mantine/core";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";

export default function Loading() {
  return (
    <Container size="lg" py="xl" className="w-full">
      <PageLoadingSkeleton />
    </Container>
  );
}
