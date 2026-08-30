"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { MyPayslips } from "./MyPayslips";
import { PayrollDisputesList } from "./PayrollDisputesList";
import { PayrollPeriodsList } from "./PayrollPeriodsList";

export function PayrollPage() {
  const user = useCurrentUser();
  const canView = user.permissions.includes("payroll.view");
  const canResolve = user.permissions.includes("payroll.dispute.resolve");

  return (
    <>
      <PageHeader
        title="Payroll"
        description="Run the monthly draft, review each employee's breakdown, and make manual adjustments before finalising."
      />

      {canView ? (
        <Tabs defaultValue="periods">
          <TabsList>
            <TabsTrigger value="periods">Periods</TabsTrigger>
            {canResolve && <TabsTrigger value="disputes">Disputes</TabsTrigger>}
            <TabsTrigger value="mine">My payslips</TabsTrigger>
          </TabsList>
          <TabsContent value="periods" className="pt-6">
            <PayrollPeriodsList />
          </TabsContent>
          {canResolve && (
            <TabsContent value="disputes" className="pt-6">
              <PayrollDisputesList />
            </TabsContent>
          )}
          <TabsContent value="mine" className="pt-6">
            <MyPayslips />
          </TabsContent>
        </Tabs>
      ) : (
        <MyPayslips />
      )}
    </>
  );
}
