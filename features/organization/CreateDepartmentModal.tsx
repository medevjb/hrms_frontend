"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ApiError } from "@/lib/api-error";
import { useCreateDepartment } from "@/services/departments";
import { EmployeeSelect } from "./EmployeeSelect";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

export function CreateDepartmentModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const createDepartment = useCreateDepartment();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [operationManagerId, setOperationManagerId] = useState<string | null>(null);

  function reset() {
    setName("");
    setDescription("");
    setOperationManagerId(null);
    setError(null);
    setFieldErrors({});
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = schema.safeParse({ name });
    if (!parsed.success) {
      setFieldErrors({ name: parsed.error.flatten().fieldErrors.name?.[0] ?? "" });
      return;
    }

    try {
      await createDepartment.mutateAsync({
        name,
        description: description || undefined,
        operation_manager_id: operationManagerId ? Number(operationManagerId) : null,
      });
      reset();
      onClose();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(caught.errors ?? {}).map(([field, messages]) => [field, messages[0]]),
          ),
        );
        setError(caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New department</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormField label="Name" htmlFor="department_name" error={fieldErrors.name}>
            <Input id="department_name" value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Description" htmlFor="department_description">
            <Input
              id="department_description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
          <EmployeeSelect
            label="Operation Manager"
            value={operationManagerId}
            onChange={setOperationManagerId}
          />
          <DialogFooter>
            <Button type="submit" disabled={createDepartment.isPending}>
              Create department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
