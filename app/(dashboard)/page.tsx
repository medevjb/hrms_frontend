import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isManagementRole } from "@/lib/permissions";
import { SelfDashboard } from "@/features/dashboard/SelfDashboard";
import { DashboardChooser } from "@/features/dashboard/DashboardChooser";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (isManagementRole(user)) {
    return <DashboardChooser firstName={user.name.split(" ")[0]} />;
  }

  return <SelfDashboard />;
}
