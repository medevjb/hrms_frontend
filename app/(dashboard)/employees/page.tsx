"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmployeesTable } from "@/features/employees/EmployeesTable";

export default function EmployeesPage() {
  return (
    <>
      <PageHeader
        title="Employees"
        description="Everyone in the organization you have visibility into."
        actions={
          <Button asChild>
            <Link href="/employees/new">
              <PlusIcon />
              Invite employee
            </Link>
          </Button>
        }
      />
      <EmployeesTable />
    </>
  );
}
