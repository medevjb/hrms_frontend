"use client";

import Link from "next/link";
import { Anchor, Badge, Button, Group, Table, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { useDepartments } from "@/services/departments";
import { useTeams } from "@/services/teams";
import { CreateTeamModal } from "./CreateTeamModal";

export function DepartmentDetail({ departmentId }: { departmentId: number }) {
  const { data: departments, isLoading: loadingDepartments } = useDepartments();
  const { data: teams, isLoading: loadingTeams } = useTeams(departmentId);
  const [opened, { open, close }] = useDisclosure(false);

  const department = departments?.find((d) => d.id === departmentId);

  if (loadingDepartments || loadingTeams) {
    return <PageLoadingSkeleton />;
  }

  if (!department) {
    return <Text c="dimmed">Department not found.</Text>;
  }

  return (
    <>
      <Group justify="space-between" mb="lg" align="flex-start">
        <div>
          <Title order={2}>{department.name}</Title>
          <Text c="dimmed">{department.description ?? "No description"}</Text>
          <Text size="sm" mt={4}>
            Operation Manager: {department.operation_manager?.full_name ?? "Unassigned"}
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Add team
        </Button>
      </Group>

      {!teams || teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Create a team in this department to start assigning members."
          action={{ label: "Add team", onClick: open }}
        />
      ) : (
        <Table.ScrollContainer minWidth={600}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Team</Table.Th>
                <Table.Th>Team Leader</Table.Th>
                <Table.Th>Members</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {teams.map((team) => (
                <Table.Tr key={team.id}>
                  <Table.Td>
                    <Anchor component={Link} href={`/teams/${team.id}`} size="sm">
                      {team.name}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{team.team_leader?.full_name ?? "—"}</Table.Td>
                  <Table.Td>{team.member_count ?? 0}</Table.Td>
                  <Table.Td>
                    <Badge color={team.active ? "green" : "gray"} variant="light">
                      {team.active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <CreateTeamModal departmentId={departmentId} opened={opened} onClose={close} />
    </>
  );
}
