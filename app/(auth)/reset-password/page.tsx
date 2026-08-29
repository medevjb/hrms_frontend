import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResetPasswordForm } from "@/features/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <div className="space-y-5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Invalid reset link</h1>
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>
            This password reset link is missing required information. Request a new one from
            the sign-in page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <ResetPasswordForm token={token} email={email} />;
}
