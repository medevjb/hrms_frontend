"use client";

import { useState } from "react";
import { AlertCircleIcon, Trash2Icon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api-error";
import { useAddTeamMember, useRemoveTeamMember, useTeam, useTeamMembers } from "@/services/teams";
import { EmployeeSelect } from "./EmployeeSelect";

export function TeamDetail({ teamId }: { teamId: number }) {
  const { data: team, isLoading: loadingTeam } = useTeam(teamId);
  const { data: members, isLoading: loadingMembers } = useTeamMembers(teamId);
  const addMember = useAddTeamMember(teamId);
  const removeMember = useRemoveTeamMember(teamId);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<{ id: number; name: string } | null>(null);

  if (loadingTeam || loadingMembers) {
    return <PageLoadingSkeleton />;
  }

  if (!team) {
    return <p className="text-sm text-muted-foreground">Team not found.</p>;
  }

  async function handleAddMember() {
    if (!selectedEmployeeId) return;

    setError(null);

    try {
      await addMember.mutateAsync({ employee_id: Number(selectedEmployeeId) });
      setSelectedEmployeeId(null);
      toast.success("Member added");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not add member.");
    }
  }

  function confirmRemoveMember() {
    if (!pendingRemoval) return;

    removeMember.mutate(pendingRemoval.id, {
      onSuccess: () => toast.success("Member removed"),
      onError: () => toast.error("Could not remove member"),
      onSettled: () => setPendingRemoval(null),
    });
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{team.name}</h1>
        <p className="text-sm text-muted-foreground">
          {team.department.name} · Team Leader: {team.team_leader?.full_name ?? "Unassigned"}
        </p>
      </div>

      <div className="mb-4 flex items-end gap-2">
        <div className="max-w-xs flex-1">
          <EmployeeSelect label="Add a member" value={selectedEmployeeId} onChange={setSelectedEmployeeId} />
        </div>
        <Button onClick={handleAddMember} disabled={!selectedEmployeeId || addMember.isPending}>
          Add
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!members || members.length === 0 ? (
        <EmptyState title="No members yet" description="Add someone to this team above." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Since</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    {member.employee.full_name}{" "}
                    <span className="text-sm text-muted-foreground">
                      ({member.employee.employee_code})
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {member.started_at}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        setPendingRemoval({ id: member.employee.id, name: member.employee.full_name })
                      }
                      aria-label="Remove member"
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {pendingRemoval?.name} from {team.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveMember}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
