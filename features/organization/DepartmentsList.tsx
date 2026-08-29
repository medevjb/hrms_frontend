"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDepartments } from "@/services/departments";
import { useDisclosure } from "@/hooks/use-disclosure";
import { CreateDepartmentModal } from "./CreateDepartmentModal";

export function DepartmentsList() {
  const { data: departments, isLoading } = useDepartments();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <PageHeader
        title="Departments & Teams"
        description="The organizational hierarchy — departments, their teams, and who leads them."
        actions={
          <Button onClick={open}>
            <PlusIcon />
            Add department
          </Button>
        }
      />

      {isLoading ? (
        <PageLoadingSkeleton />
      ) : !departments || departments.length === 0 ? (
        <EmptyState
          title="No departments yet"
          description="Create your first department to start building the org chart."
          action={{ label: "Add department", onClick: open }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Operation Manager</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>
                    <Link
                      href={`/departments/${department.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {department.name}
                    </Link>
                  </TableCell>
                  <TableCell>{department.operation_manager?.full_name ?? "—"}</TableCell>
                  <TableCell>
                    <StatusChip tone={department.active ? "success" : "neutral"}>
                      {department.active ? "Active" : "Inactive"}
                    </StatusChip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateDepartmentModal opened={opened} onClose={close} />
    </>
  );
}
