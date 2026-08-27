"use client";

import { useState } from "react";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconTrash } from "@tabler/icons-react";
import { ApiError } from "@/lib/api-error";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { useAddTeamMember, useRemoveTeamMember, useTeam, useTeamMembers } from "@/services/teams";
import { EmployeeSelect } from "./EmployeeSelect";

export function TeamDetail({ teamId }: { teamId: number }) {
  const { data: team, isLoading: loadingTeam } = useTeam(teamId);
  const { data: members, isLoading: loadingMembers } = useTeamMembers(teamId);
  const addMember = useAddTeamMember(teamId);
  const removeMember = useRemoveTeamMember(teamId);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loadingTeam || loadingMembers) {
    return <PageLoadingSkeleton />;
  }

  if (!team) {
    return <Text c="dimmed">Team not found.</Text>;
  }

  async function handleAddMember() {
    if (!selectedEmployeeId) return;

    setError(null);

    try {
      await addMember.mutateAsync({ employee_id: Number(selectedEmployeeId) });
      setSelectedEmployeeId(null);
      notifications.show({ message: "Member added", color: "green" });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not add member.");
    }
  }

  function handleRemoveMember(employeeId: number, name: string) {
    modals.openConfirmModal({
      title: "Remove team member",
      children: <Text size="sm">Remove {name} from {team!.name}?</Text>,
      labels: { confirm: "Remove", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        removeMember.mutate(employeeId, {
          onSuccess: () => notifications.show({ message: "Member removed", color: "green" }),
          onError: () => notifications.show({ message: "Could not remove member", color: "red" }),
        });
      },
    });
  }

  return (
    <>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>{team.name}</Title>
          <Text c="dimmed">
            {team.department.name} · Team Leader: {team.team_leader?.full_name ?? "Unassigned"}
          </Text>
        </div>
      </Group>

      <Group mb="md" align="flex-end" gap="sm">
        <div style={{ flex: 1, maxWidth: 320 }}>
          <EmployeeSelect
            label="Add a member"
            value={selectedEmployeeId}
            onChange={setSelectedEmployeeId}
          />
        </div>
        <Button onClick={handleAddMember} disabled={!selectedEmployeeId} loading={addMember.isPending}>
          Add
        </Button>
      </Group>

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={18} />} mb="md">
          {error}
        </Alert>
      )}

      {!members || members.length === 0 ? (
        <EmptyState title="No members yet" description="Add someone to this team above." />
      ) : (
        <Table.ScrollContainer minWidth={500}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Employee</Table.Th>
                <Table.Th>Since</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {members.map((member) => (
                <Table.Tr key={member.id}>
                  <Table.Td>
                    {member.employee.full_name}{" "}
                    <Text span c="dimmed" size="sm">
                      ({member.employee.employee_code})
                    </Text>
                  </Table.Td>
                  <Table.Td>{member.started_at}</Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => handleRemoveMember(member.employee.id, member.employee.full_name)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </>
  );
}
