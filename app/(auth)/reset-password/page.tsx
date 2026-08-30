import Link from "next/link";
import { AlertTriangleIcon, ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResetPasswordForm } from "@/features/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangleIcon className="size-7" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Invalid Reset Link
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            This password reset link is incomplete or has expired. Please request a new link from the sign-in page.
          </p>
        </div>

        <Button asChild className="w-full h-11 text-sm font-semibold rounded-xl gap-2 mt-2">
          <Link href="/forgot-password">
            <ArrowLeftIcon className="size-4" />
            <span>Request New Reset Link</span>
          </Link>
        </Button>
      </div>
    );
  }

  return <ResetPasswordForm token={token} email={email} />;
}

