import { Alert, Stack, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { ResetPasswordForm } from "@/features/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <Stack gap="md">
        <Title order={2}>Invalid reset link</Title>
        <Alert color="red" icon={<IconAlertCircle size={18} />}>
          This password reset link is missing required information. Request
          a new one from the sign-in page.
        </Alert>
      </Stack>
    );
  }

  return <ResetPasswordForm token={token} email={email} />;
}
