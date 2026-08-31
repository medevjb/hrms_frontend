"use client";

import { LockIcon, UserRoundIcon } from "lucide-react";
import { SettingsScaffold } from "@/components/layouts/SettingsScaffold";
import { ProfileSection } from "./ProfileSection";
import { SecuritySection } from "./SecuritySection";

export function AccountPage() {
  return (
    <SettingsScaffold
      title="My profile"
      description="Your personal details and sign-in security."
      groups={[
        {
          sections: [
            {
              value: "profile",
              label: "Profile",
              icon: UserRoundIcon,
              blurb: "How you appear across the app, plus the contact details HR keeps on file.",
              render: () => <ProfileSection />,
            },
            {
              value: "security",
              label: "Security",
              icon: LockIcon,
              blurb: "Your password and two-factor status.",
              render: () => <SecuritySection />,
            },
          ],
        },
      ]}
    />
  );
}
