import { redirect } from "next/navigation";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { CurrentUserProvider } from "@/features/auth/CurrentUserContext";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <CurrentUserProvider user={user}>
      <AppShellLayout>{children}</AppShellLayout>
    </CurrentUserProvider>
  );
}
