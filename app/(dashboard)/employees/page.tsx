"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { EmployeesTable } from "@/features/employees/EmployeesTable";
import { InviteEmployeeDialog } from "@/features/employees/InviteEmployeeDialog";
import { useDisclosure } from "@/hooks/use-disclosure";

export default function EmployeesPage() {
  const user = useCurrentUser();
  const canInvite = user.permissions.includes("employee.create");
  const [inviteOpen, { open: openInvite, close: closeInvite }] = useDisclosure(false);

  return (
    <>
      <PageHeader
        title="Employees"
        description="Everyone in the organization you have visibility into."
        actions={
          canInvite && (
            <Button onClick={openInvite}>
              <PlusIcon />
              Invite employee
            </Button>
          )
        }
      />
      <EmployeesTable onInvite={canInvite ? openInvite : undefined} />
      <InviteEmployeeDialog opened={inviteOpen} onClose={closeInvite} />
    </>
  );
}
