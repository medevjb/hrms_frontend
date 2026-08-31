"use client";

import {
  BuildingIcon,
  CalendarOffIcon,
  ClockIcon,
  MailIcon,
  PaletteIcon,
  PlaneIcon,
  TimerIcon,
  WalletIcon,
} from "lucide-react";
import {
  SettingsScaffold,
  type SettingsSection,
  type SettingsSectionGroup,
} from "@/components/layouts/SettingsScaffold";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { canAny } from "@/lib/permissions";
import type { PermissionName } from "@/types/auth";
import { AttendanceSettingsTab } from "./AttendanceSettingsTab";
import { BrandingSection } from "./BrandingSection";
import { EmailSection } from "./EmailSection";
import { LeaveSettingsTab } from "./LeaveSettingsTab";
import { OrganizationSettingsTab } from "./OrganizationSettingsTab";
import { OvertimeSettingsTab } from "./OvertimeSettingsTab";
import { PayrollSettingsTab } from "./PayrollSettingsTab";
import { WeeklyOffsSection } from "./WeeklyOffsSection";

type GuardedSection = SettingsSection & { permissions: PermissionName[] };

const ORGANIZATION: GuardedSection[] = [
  {
    value: "general",
    label: "General",
    icon: BuildingIcon,
    blurb: "Company name, timezone, currency, and the default weekly off day.",
    permissions: ["settings.manage"],
    render: () => <OrganizationSettingsTab />,
  },
  {
    value: "branding",
    label: "Branding",
    icon: PaletteIcon,
    blurb: "The name, logo, and favicon shown across the app and on the sign-in screen.",
    permissions: ["settings.manage"],
    render: () => <BrandingSection />,
  },
  {
    value: "email",
    label: "Email",
    icon: MailIcon,
    blurb: "The address invitations and notifications are sent from, and the SMTP server that delivers them.",
    permissions: ["settings.manage"],
    render: () => <EmailSection />,
  },
  {
    value: "weekly-offs",
    label: "Weekly offs",
    icon: CalendarOffIcon,
    blurb: "Give a person or a whole team a different rest day from the organization default.",
    permissions: ["employee.update"],
    render: () => <WeeklyOffsSection />,
  },
];

const POLICIES: GuardedSection[] = [
  {
    value: "attendance",
    label: "Attendance",
    icon: ClockIcon,
    permissions: ["attendance.settings.manage"],
    render: () => <AttendanceSettingsTab />,
  },
  {
    value: "leave",
    label: "Leave",
    icon: PlaneIcon,
    permissions: ["leave.policy.manage"],
    render: () => <LeaveSettingsTab />,
  },
  {
    value: "overtime",
    label: "Overtime",
    icon: TimerIcon,
    permissions: ["overtime.policy.manage"],
    render: () => <OvertimeSettingsTab />,
  },
  {
    value: "payroll",
    label: "Payroll",
    icon: WalletIcon,
    permissions: ["payroll.settings.manage"],
    render: () => <PayrollSettingsTab />,
  },
];

export function SettingsPage() {
  const user = useCurrentUser();
  const allow = (sections: GuardedSection[]) =>
    sections.filter((section) => canAny(user.permissions, section.permissions));

  const groups: SettingsSectionGroup[] = [
    { label: "Organization", sections: allow(ORGANIZATION) },
    { label: "Policies", sections: allow(POLICIES) },
  ].filter((group) => group.sections.length > 0);

  return (
    <SettingsScaffold
      title="System settings"
      description="Organization-wide configuration for the whole HRM."
      groups={groups}
    />
  );
}
