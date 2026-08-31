import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isManagementRole } from "@/lib/permissions";
import { ManagementDashboard } from "@/features/dashboard/ManagementDashboard";

export default async function ManageDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isManagementRole(user)) {
    redirect("/dashboard/me");
  }

  return <ManagementDashboard />;
}
