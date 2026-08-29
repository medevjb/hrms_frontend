"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { Button } from "@/components/ui/button";
import { LeaveBalancesSummary } from "./LeaveBalancesSummary";
import { LeaveRequestsList } from "./LeaveRequestsList";
import { LeaveTypesManager } from "./LeaveTypesManager";
import { SubmitLeaveRequestDialog } from "./SubmitLeaveRequestDialog";

export function LeavePage() {
  const user = useCurrentUser();
  const canApprove = user.permissions.includes("leave.approve");
  const canManageTypes = user.permissions.includes("leave.policy.manage");
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <PageHeader
        title="Leave"
        description="Request time off and track your balance, or review requests waiting on your approval."
        actions={<Button onClick={open}>Request leave</Button>}
      />

      <LeaveBalancesSummary />

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My requests</TabsTrigger>
          {canApprove && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
          {canManageTypes && <TabsTrigger value="types">Leave types</TabsTrigger>}
        </TabsList>

        <TabsContent value="mine" className="pt-6">
          <LeaveRequestsList mode="mine" />
        </TabsContent>
        {canApprove && (
          <TabsContent value="approvals" className="pt-6">
            <LeaveRequestsList mode="pending_approval" />
          </TabsContent>
        )}
        {canManageTypes && (
          <TabsContent value="types" className="pt-6">
            <LeaveTypesManager />
          </TabsContent>
        )}
      </Tabs>

      <SubmitLeaveRequestDialog opened={opened} onClose={close} />
    </>
  );
}
