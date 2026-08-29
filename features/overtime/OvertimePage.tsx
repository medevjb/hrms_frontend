"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { OvertimeRecordsList } from "./OvertimeRecordsList";

export function OvertimePage() {
  const user = useCurrentUser();
  const canApprove = user.permissions.includes("overtime.approve");
  const canReview = user.permissions.includes("overtime.review");

  return (
    <>
      <PageHeader
        title="Overtime"
        description="Weekend and holiday work detected from attendance, and the records waiting on your approval."
      />

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My overtime</TabsTrigger>
          {canApprove && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
          {canReview && <TabsTrigger value="all">All records</TabsTrigger>}
        </TabsList>

        <TabsContent value="mine" className="pt-6">
          <OvertimeRecordsList mode="mine" />
        </TabsContent>
        {canApprove && (
          <TabsContent value="approvals" className="pt-6">
            <OvertimeRecordsList mode="pending_approval" />
          </TabsContent>
        )}
        {canReview && (
          <TabsContent value="all" className="pt-6">
            <OvertimeRecordsList mode="all" />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
