"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { RowActions } from "@/components/ui/RowActions";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useDepartments } from "@/services/departments";
import { useDeleteTeam, useTeams } from "@/services/teams";
import { apiErrorMessage } from "@/lib/api-error";
import type { Team } from "@/types/organization";
import { CreateTeamModal } from "./CreateTeamModal";

export function DepartmentDetail({ departmentId }: { departmentId: number }) {
  const user = useCurrentUser();
  const canManage = user.permissions.includes("team.manage");
  const { data: departments, isLoading: loadingDepartments } = useDepartments();
  const { data: teams, isLoading: loadingTeams } = useTeams(departmentId);
  const deleteTeam = useDeleteTeam();
  const [opened, { open, close }] = useDisclosure(false);
  const [pendingDelete, setPendingDelete] = useState<Team | null>(null);

  const department = departments?.find((d) => d.id === departmentId);

  if (loadingDepartments || loadingTeams) {
    return <PageLoadingSkeleton />;
  }

  if (!department) {
    return <p className="text-sm text-muted-foreground">Department not found.</p>;
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{department.name}</h1>
          <p className="text-sm text-muted-foreground">{department.description ?? "No description"}</p>
          <p className="mt-1 text-sm text-foreground">
            Operation Manager: {department.operation_manager?.full_name ?? "Unassigned"}
          </p>
        </div>
        {canManage && (
          <Button onClick={open}>
            <PlusIcon />
            Add team
          </Button>
        )}
      </div>

      {!teams || teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Create a team in this department to start assigning members."
          action={canManage ? { label: "Add team", onClick: open } : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Team Leader</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <Link href={`/teams/${team.id}`} className="font-medium text-primary hover:underline">
                      {team.name}
                    </Link>
                  </TableCell>
                  <TableCell>{team.team_leader?.full_name ?? "—"}</TableCell>
                  <TableCell>{team.member_count ?? 0}</TableCell>
                  <TableCell>
                    <StatusChip tone={team.active ? "success" : "neutral"}>
                      {team.active ? "Active" : "Inactive"}
                    </StatusChip>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <RowActions
                        viewHref={`/teams/${team.id}`}
                        onDelete={() => setPendingDelete(team)}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateTeamModal departmentId={departmentId} opened={opened} onClose={close} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => !next && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.name ?? "team"}?`}
        description="This permanently removes the team. It's blocked if anyone is on the team's roster (current or past) — remove current members and archive instead."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteTeam.mutateAsync(pendingDelete.id);
            toast.success("Team deleted");
          } catch (caught) {
            toast.error(apiErrorMessage(caught, "Could not delete team"));
          }
        }}
      />
    </>
  );
}
