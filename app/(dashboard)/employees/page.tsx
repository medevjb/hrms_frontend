"use client";

import Link from "next/link";
import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmployeesTable } from "@/features/employees/EmployeesTable";

export default function EmployeesPage() {
  return (
    <>
      <PageHeader
        title="Employees"
        description="Everyone in the organization you have visibility into."
        actions={
          <Button component={Link} href="/employees/new" leftSection={<IconPlus size={16} />}>
            Invite employee
          </Button>
        }
      />
      <EmployeesTable />
    </>
  );
}
