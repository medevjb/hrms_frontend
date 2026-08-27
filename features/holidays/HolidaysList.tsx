"use client";

import { useState } from "react";
import { ActionIcon, Badge, Group, Table, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { useDeleteHoliday, useHolidays } from "@/services/holidays";
import type { Holiday } from "@/types/holidays";
import { SaveHolidayModal } from "./SaveHolidayModal";

const TYPE_COLORS: Record<Holiday["type"], string> = {
  NATIONAL: "blue",
  RELIGIOUS: "grape",
  COMPANY: "teal",
  OTHER: "gray",
};

export function HolidaysList() {
  const { data: holidays, isLoading } = useHolidays();
  const deleteHoliday = useDeleteHoliday();
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<Holiday | undefined>(undefined);

  function openCreate() {
    setEditing(undefined);
    open();
  }

  function openEdit(holiday: Holiday) {
    setEditing(holiday);
    open();
  }

  function confirmDelete(holiday: Holiday) {
    modals.openConfirmModal({
      title: "Delete holiday",
      children: <Text size="sm">Remove {holiday.title} from the holiday calendar?</Text>,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteHoliday.mutate(holiday.id, {
          onSuccess: () => notifications.show({ message: "Holiday deleted", color: "green" }),
          onError: () => notifications.show({ message: "Delete failed", color: "red" }),
        });
      },
    });
  }

  return (
    <>
      <PageHeader
        title="Holiday calendar"
        description="Company holidays — feeds the work-day calculation everywhere attendance and overtime need it."
        actions={
          <ActionIcon variant="filled" onClick={openCreate} size="lg" aria-label="Add holiday">
            <IconPlus size={18} />
          </ActionIcon>
        }
      />

      {isLoading ? (
        <PageLoadingSkeleton />
      ) : !holidays || holidays.length === 0 ? (
        <EmptyState
          title="No holidays yet"
          description="Add the first holiday to the calendar."
          action={{ label: "Add holiday", onClick: openCreate }}
        />
      ) : (
        <Table.ScrollContainer minWidth={700}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {holidays.map((holiday) => (
                <Table.Tr key={holiday.id}>
                  <Table.Td>{holiday.title}</Table.Td>
                  <Table.Td>{holiday.date}</Table.Td>
                  <Table.Td>
                    <Badge color={TYPE_COLORS[holiday.type]} variant="light">
                      {holiday.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={holiday.active ? "green" : "gray"} variant="light">
                      {holiday.active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => openEdit(holiday)}
                        aria-label="Edit holiday"
                      >
                        <IconPencil size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => confirmDelete(holiday)}
                        aria-label="Delete holiday"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <SaveHolidayModal opened={opened} onClose={close} holiday={editing} />
    </>
  );
}
