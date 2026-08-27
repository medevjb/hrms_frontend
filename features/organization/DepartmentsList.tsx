"use client";

import Link from "next/link";
import { Anchor, Badge, Button, Table } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { useDepartments } from "@/services/departments";
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
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
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
        <Table.ScrollContainer minWidth={600}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Operation Manager</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {departments.map((department) => (
                <Table.Tr key={department.id}>
                  <Table.Td>
                    <Anchor component={Link} href={`/departments/${department.id}`} size="sm">
                      {department.name}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{department.operation_manager?.full_name ?? "—"}</Table.Td>
                  <Table.Td>
                    <Badge color={department.active ? "green" : "gray"} variant="light">
                      {department.active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <CreateDepartmentModal opened={opened} onClose={close} />
    </>
  );
}
