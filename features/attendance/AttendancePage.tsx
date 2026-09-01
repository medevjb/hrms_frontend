"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { AttendanceCalendarView } from "./AttendanceCalendarView";
import { AttendanceList } from "./AttendanceList";

export function AttendancePage() {
  const user = useCurrentUser();
  // Team Members only ever see their own attendance — the records table is
  // a "within your visibility" view that doesn't add anything for them.
  const canSeeRecordsTable = user.permissions.includes("employee.view");

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Your attendance month at a glance — check-ins, check-outs, and status day by day."
      />

      {canSeeRecordsTable ? (
        <Tabs defaultValue="calendar">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="pt-6">
            <AttendanceCalendarView />
          </TabsContent>
          <TabsContent value="records" className="pt-6">
            <AttendanceList />
          </TabsContent>
        </Tabs>
      ) : (
        <AttendanceCalendarView />
      )}
    </>
  );
}
