"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { canAny } from "@/lib/permissions";
import type { PermissionName } from "@/types/auth";
import { AttendanceSettingsTab } from "./AttendanceSettingsTab";
import { LeaveSettingsTab } from "./LeaveSettingsTab";
import { OrganizationSettingsTab } from "./OrganizationSettingsTab";
import { OvertimeSettingsTab } from "./OvertimeSettingsTab";
import { PasswordTab } from "./PasswordTab";
import { PayrollSettingsTab } from "./PayrollSettingsTab";

type SettingsTab = {
  value: string;
  label: string;
  permissions?: PermissionName[];
  render: () => React.ReactNode;
};

const TABS: SettingsTab[] = [
  { value: "password", label: "Password", render: () => <PasswordTab /> },
  {
    value: "organization",
    label: "Organization",
    permissions: ["settings.manage"],
    render: () => <OrganizationSettingsTab />,
  },
  {
    value: "attendance",
    label: "Attendance",
    permissions: ["attendance.settings.manage"],
    render: () => <AttendanceSettingsTab />,
  },
  {
    value: "leave",
    label: "Leave",
    permissions: ["leave.policy.manage"],
    render: () => <LeaveSettingsTab />,
  },
  {
    value: "overtime",
    label: "Overtime",
    permissions: ["overtime.policy.manage"],
    render: () => <OvertimeSettingsTab />,
  },
  {
    value: "payroll",
    label: "Payroll",
    permissions: ["payroll.settings.manage"],
    render: () => <PayrollSettingsTab />,
  },
];

export function SettingsPage() {
  const user = useCurrentUser();
  const tabs = TABS.filter((tab) => !tab.permissions || canAny(user.permissions, tab.permissions));
  const hasOrgSettings = tabs.length > 1;

  return (
    <>
      <PageHeader
        title="Settings"
        description={
          hasOrgSettings
            ? "Your password, plus the organization-wide configuration you manage."
            : "Change your password."
        }
      />

      <Tabs defaultValue="password">
        <TabsList className="max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="pt-6">
            {tab.render()}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
