"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="pt-6">
          <OrganizationSettingsTab />
        </TabsContent>
        <TabsContent value="attendance" className="pt-6">
          <AttendanceSettingsTab />
        </TabsContent>
        <TabsContent value="overtime" className="pt-6">
          <OvertimeSettingsTab />
        </TabsContent>
        <TabsContent value="payroll" className="pt-6">
          <PayrollSettingsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
