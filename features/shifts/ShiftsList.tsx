"use client";

import { useState } from "react";
import { ActionIcon, Badge, Table } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPencil, IconPlus } from "@tabler/icons-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { useShifts } from "@/services/shifts";
import type { Shift } from "@/types/shifts";
import { SaveShiftModal } from "./SaveShiftModal";

export function ShiftsList() {
  const { data: shifts, isLoading } = useShifts();
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<Shift | undefined>(undefined);

  function openCreate() {
    setEditing(undefined);
    open();
  }

  function openEdit(shift: Shift) {
    setEditing(shift);
    open();
  }

  return (
    <>
      <PageHeader
        title="Shifts"
        description="The shift catalogue — start/end times, expected hours, and any shift-specific late grace override."
        actions={
          <ActionIcon.Group>
            <ActionIcon variant="filled" onClick={openCreate} size="lg" aria-label="Add shift">
              <IconPlus size={18} />
            </ActionIcon>
          </ActionIcon.Group>
        }
      />

      {isLoading ? (
        <PageLoadingSkeleton />
      ) : !shifts || shifts.length === 0 ? (
        <EmptyState
          title="No shifts yet"
          description="Create a shift so employees can be assigned to it."
          action={{ label: "Add shift", onClick: openCreate }}
        />
      ) : (
        <Table.ScrollContainer minWidth={700}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Hours</Table.Th>
                <Table.Th>Expected work</Table.Th>
                <Table.Th>Late grace</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {shifts.map((shift) => (
                <Table.Tr key={shift.id}>
                  <Table.Td>{shift.name}</Table.Td>
                  <Table.Td>
                    {shift.start_time}–{shift.end_time}
                    {shift.is_overnight && (
                      <Badge ml="xs" size="sm" variant="light" color="grape">
                        Overnight
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>{shift.expected_work_minutes} min</Table.Td>
                  <Table.Td>
                    {shift.late_grace_minutes === null
                      ? "Organization default"
                      : `${shift.late_grace_minutes} min`}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={shift.active ? "green" : "gray"} variant="light">
                      {shift.active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon variant="subtle" onClick={() => openEdit(shift)} aria-label="Edit shift">
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <SaveShiftModal opened={opened} onClose={close} shift={editing} />
    </>
  );
}
