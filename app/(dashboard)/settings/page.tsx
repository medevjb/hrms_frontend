import { Suspense } from "react";
import { SettingsPage } from "@/features/settings/SettingsPage";

export const metadata = { title: "System settings" };

export default function Settings() {
  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  );
}
