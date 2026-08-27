"use client";

import { Tabs } from "@mantine/core";
import { PageHeader } from "@/components/ui/PageHeader";
import { AttendanceSettingsTab } from "./AttendanceSettingsTab";
import { OrganizationSettingsTab } from "./OrganizationSettingsTab";
import { OvertimeSettingsTab } from "./OvertimeSettingsTab";
import { PayrollSettingsTab } from "./PayrollSettingsTab";

export function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Organization-wide configuration. Nothing here is ever hard-coded elsewhere in the app."
      />

      <Tabs defaultValue="organization" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="organization">Organization</Tabs.Tab>
          <Tabs.Tab value="attendance">Attendance</Tabs.Tab>
          <Tabs.Tab value="overtime">Overtime</Tabs.Tab>
          <Tabs.Tab value="payroll">Payroll</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="organization" pt="lg">
          <OrganizationSettingsTab />
        </Tabs.Panel>
        <Tabs.Panel value="attendance" pt="lg">
          <AttendanceSettingsTab />
        </Tabs.Panel>
        <Tabs.Panel value="overtime" pt="lg">
          <OvertimeSettingsTab />
        </Tabs.Panel>
        <Tabs.Panel value="payroll" pt="lg">
          <PayrollSettingsTab />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
