"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-error";
import { useCreateTeam } from "@/services/teams";
import { EmployeeSelect } from "./EmployeeSelect";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

export function CreateTeamModal({
  departmentId,
  opened,
  onClose,
}: {
  departmentId: number;
  opened: boolean;
  onClose: () => void;
}) {
  const createTeam = useCreateTeam();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [teamLeaderId, setTeamLeaderId] = useState<string | null>(null);

  function reset() {
    setName("");
    setTeamLeaderId(null);
    setFieldErrors({});
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    const parsed = schema.safeParse({ name });
    if (!parsed.success) {
      setFieldErrors({ name: parsed.error.flatten().fieldErrors.name?.[0] ?? "" });
      return;
    }

    try {
      await createTeam.mutateAsync({
        department_id: departmentId,
        name,
        team_leader_id: teamLeaderId ? Number(teamLeaderId) : null,
      });
      toast.success("Team created");
      reset();
      onClose();
    } catch (caught) {
      // The failure toast is fired by the global mutation handler; here we
      // only fan the server's field errors out under their inputs.
      if (caught instanceof ApiError) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(caught.errors ?? {}).map(([field, messages]) => [field, messages[0]]),
          ),
        );
      }
    }
  }

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" htmlFor="team_name" error={fieldErrors.name}>
            <Input id="team_name" value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <EmployeeSelect label="Team Leader" value={teamLeaderId} onChange={setTeamLeaderId} />
          <DialogFooter>
            <Button type="submit" disabled={createTeam.isPending}>
              Create team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
