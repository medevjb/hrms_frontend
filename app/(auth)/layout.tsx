import { Center, Container } from "@mantine/core";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Center className="flex-1">
      <Container size="xs" w="100%" py="xl">
        {children}
      </Container>
    </Center>
  );
}
