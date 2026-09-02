"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { RowActions } from "@/components/ui/RowActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { StatusSwitch } from "@/components/ui/StatusSwitch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { ApiError } from "@/lib/api-error";
import {
  useCreateSalaryComponent,
  useDeleteSalaryComponent,
  useSalaryComponents,
  useUpdateSalaryComponent,
  type SaveSalaryComponentInput,
} from "@/services/payroll";
import type { SalaryComponent } from "@/types/payroll";

function ComponentStatusSwitch({ component }: { component: SalaryComponent }) {
  const update = useUpdateSalaryComponent(component.id);

  return (
    <StatusSwitch
      checked={component.is_active}
      disabled={component.type === "BASIC"}
      entityLabel={`the ${component.name} component`}
      onConfirm={async (next) => {
        await update.mutateAsync({ is_active: next });
        toast.success(next ? "Component activated" : "Component deactivated");
      }}
    />
  );
}

function ComponentForm({
  component,
  onClose,
}: {
  component: SalaryComponent | null;
  onClose: () => void;
}) {
  const isEdit = component !== null;
  const create = useCreateSalaryComponent();
  const update = useUpdateSalaryComponent(component?.id ?? 0);
  const [values, setValues] = useState<SaveSalaryComponentInput>(() =>
    component
      ? { name: component.name, sort_order: component.sort_order }
      : { type: "ALLOWANCE", sort_order: 0 },
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    try {
      if (isEdit) {
        await update.mutateAsync({ name: values.name, sort_order: values.sort_order });
      } else {
        await create.mutateAsync(values);
      }
      toast.success(isEdit ? "Component updated" : "Component created");
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
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit salary component" : "New salary component"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
          {!isEdit && (
            <>
              <FormField
                label="Code"
                htmlFor="component_code"
                description="Immutable — payroll snapshots reference it. Letters, numbers, dashes."
                error={fieldErrors.code}
              >
                <Input
                  id="component_code"
                  value={values.code ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, code: e.target.value }))}
                />
              </FormField>
              <FormField label="Type" error={fieldErrors.type}>
                <Select
                  value={values.type ?? "ALLOWANCE"}
                  onValueChange={(v) =>
                    setValues((cur) => ({ ...cur, type: v as SaveSalaryComponentInput["type"] }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALLOWANCE">Allowance</SelectItem>
                    <SelectItem value="BASIC">Basic</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </>
          )}
          <FormField label="Name" htmlFor="component_name" error={fieldErrors.name}>
            <Input
              id="component_name"
              value={values.name ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
          </FormField>
          <FormField label="Sort order" htmlFor="component_sort" error={fieldErrors.sort_order}>
            <Input
              id="component_sort"
              type="number"
              min={0}
              max={99}
              value={values.sort_order ?? 0}
              onChange={(e) => setValues((v) => ({ ...v, sort_order: Number(e.target.value) }))}
            />
          </FormField>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {isEdit ? "Save changes" : "Create component"}
            </Button>
          </DialogFooter>
      </form>
    </>
  );
}

function SaveComponentDialog({
  component,
  open,
  onClose,
}: {
  component: SalaryComponent | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {open && <ComponentForm key={component?.id ?? "new"} component={component} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

export function SalaryComponentsCard() {
  const user = useCurrentUser();
  const canManage = user.permissions.includes("payroll.settings.manage");
  const { data: components, isLoading } = useSalaryComponents();
  const deleteComponent = useDeleteSalaryComponent();
  const [editing, setEditing] = useState<SalaryComponent | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SalaryComponent | null>(null);

  if (!canManage) {
    return null;
  }

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Salary component catalogue</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
          <PlusIcon className="size-4" /> Add component
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(components ?? []).map((component) => (
                <TableRow key={component.id}>
                  <TableCell className="font-medium">{component.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {component.code}
                  </TableCell>
                  <TableCell>
                    <StatusChip tone={component.type === "BASIC" ? "info" : "neutral"}>
                      {component.type === "BASIC" ? "Basic" : "Allowance"}
                    </StatusChip>
                  </TableCell>
                  <TableCell>
                    <ComponentStatusSwitch component={component} />
                  </TableCell>
                  <TableCell>
                    <RowActions
                      onEdit={() => setEditing(component)}
                      onDelete={
                        component.type === "BASIC"
                          ? undefined
                          : () => setPendingDelete(component)
                      }
                      deleteTitle="Delete this component"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <SaveComponentDialog
        component={null}
        open={creating}
        onClose={() => setCreating(false)}
      />
      <SaveComponentDialog
        component={editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => !next && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.name ?? "component"}?`}
        description="This permanently removes the component from the catalogue. It's blocked if any employee salary still uses it — deactivate it instead."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteComponent.mutateAsync(pendingDelete.id);
          toast.success("Component deleted");
        }}
      />
    </Card>
  );
}
