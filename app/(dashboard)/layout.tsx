import { AppShellLayout } from "@/components/layouts/AppShellLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO(Phase 1): gate this layout behind an authenticated session once
  // the auth module exists (docs/PRD.md §92) — every page under this route
  // group is assumed to require login.
  return <AppShellLayout>{children}</AppShellLayout>;
}
