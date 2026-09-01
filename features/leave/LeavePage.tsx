"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { Button } from "@/components/ui/button";
import { EmployeeLeaveBalances } from "./EmployeeLeaveBalances";
import { LeaveBalancePanel } from "./LeaveBalancePanel";
import { LeaveRequestsList } from "./LeaveRequestsList";
import { SubmitLeaveRequestDialog } from "./SubmitLeaveRequestDialog";

export function LeavePage() {
  const user = useCurrentUser();
  const canApprove = user.permissions.includes("leave.approve");
  const canReview = user.permissions.includes("leave.review");
  const canAdjustBalances = user.permissions.includes("leave.balance.adjust");
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <PageHeader
        title="Leave"
        description="Request time off and track your balance, or review requests waiting on your approval."
        actions={<Button onClick={open}>Request leave</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0">
          <Tabs defaultValue="mine">
            <TabsList>
              <TabsTrigger value="mine">My requests</TabsTrigger>
              {canApprove && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
              {canReview && <TabsTrigger value="all">All requests</TabsTrigger>}
              {canAdjustBalances && <TabsTrigger value="balances">Balances</TabsTrigger>}
            </TabsList>

            <TabsContent value="mine" className="pt-6">
              <LeaveRequestsList mode="mine" />
            </TabsContent>
            {canApprove && (
              <TabsContent value="approvals" className="pt-6">
                <LeaveRequestsList mode="pending_approval" />
              </TabsContent>
            )}
            {canReview && (
              <TabsContent value="all" className="pt-6">
                <LeaveRequestsList mode="all" />
              </TabsContent>
            )}
            {canAdjustBalances && (
              <TabsContent value="balances" className="pt-6">
                <EmployeeLeaveBalances />
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <LeaveBalancePanel />
        </div>
      </div>

      <SubmitLeaveRequestDialog opened={opened} onClose={close} />
    </>
  );
}
