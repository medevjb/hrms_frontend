"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalEventsTab } from "@/features/personal-events/PersonalEventsTab";
import { HolidayCalendar } from "./HolidayCalendar";
import { HolidayNoticesList } from "./HolidayNoticesList";
import { HolidaysList } from "./HolidaysList";
import { SyncBangladeshHolidaysButton } from "./SyncBangladeshHolidaysButton";

export function HolidaysPage() {
  return (
    <>
      <PageHeader
        title="Holiday calendar"
        description="Company holidays — feeds the work-day calculation everywhere attendance and overtime need it."
        actions={<SyncBangladeshHolidaysButton />}
      />

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="my-events">My events</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="pt-6">
          <HolidayCalendar />
        </TabsContent>
        <TabsContent value="list" className="pt-6">
          <HolidaysList />
        </TabsContent>
        <TabsContent value="my-events" className="pt-6">
          <PersonalEventsTab />
        </TabsContent>
        <TabsContent value="notices" className="pt-6">
          <HolidayNoticesList />
        </TabsContent>
      </Tabs>
    </>
  );
}
