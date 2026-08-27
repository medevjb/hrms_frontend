"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Anchor,
  Group,
  Pagination,
  Select,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { useEmployees } from "@/services/employees";
import type { EmployeeStatus } from "@/types/organization";
import { EmployeeStatusBadge } from "./EmployeeStatusBadge";

const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "INVITED", label: "Invited" },
  { value: "ACTIVE", label: "Active" },
  { value: "PROBATION", label: "Probation" },
  { value: "NOTICE_PERIOD", label: "Notice period" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "ARCHIVED", label: "Archived" },
];

export function EmployeesTable() {
  const [status, setStatus] = useState<EmployeeStatus | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useEmployees({ status: status ?? undefined, page });

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  const employees = (data?.data ?? []).filter((employee) =>
    search.trim() === ""
      ? true
      : employee.full_name.toLowerCase().includes(search.toLowerCase())
        || employee.employee_code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Group mb="md" gap="sm">
        <TextInput
          placeholder="Search by name or code"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          w={280}
        />
        <Select
          placeholder="All statuses"
          data={STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setStatus(value as EmployeeStatus | null);
            setPage(1);
          }}
          clearable
          w={200}
        />
      </Group>

      {employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Invite your first employee to get started."
        />
      ) : (
        <>
          <Table.ScrollContainer minWidth={700}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Designation</Table.Th>
                  <Table.Th>Department</Table.Th>
                  <Table.Th>Team</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {employees.map((employee) => (
                  <Table.Tr key={employee.id}>
                    <Table.Td>
                      <Anchor component={Link} href={`/employees/${employee.id}`} size="sm">
                        {employee.full_name}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {employee.employee_code}
                      </Text>
                    </Table.Td>
                    <Table.Td>{employee.designation}</Table.Td>
                    <Table.Td>{employee.department?.name ?? "—"}</Table.Td>
                    <Table.Td>{employee.team?.name ?? "—"}</Table.Td>
                    <Table.Td>
                      <EmployeeStatusBadge status={employee.status} />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          {data && data.meta.last_page > 1 && (
            <Group justify="center" mt="md">
              <Pagination value={page} onChange={setPage} total={data.meta.last_page} />
            </Group>
          )}
        </>
      )}
    </>
  );
}
