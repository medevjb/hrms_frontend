"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BulkBar } from "@/components/ui/BulkBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { SettingsCard } from "@/components/ui/SettingsCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useRowSelection } from "@/hooks/use-row-selection";
import { apiErrorMessage } from "@/lib/api-error";
import { useAssignWeeklyOff, useEmployees, useUpdateEmployee } from "@/services/employees";
import { useOrganizationSettings } from "@/services/settings";
import { useTeams } from "@/services/teams";
import type { Employee } from "@/types/organization";
import type { Weekday } from "@/types/settings";
import { WEEKDAYS } from "@/types/settings";

const DEFAULT = "default";

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function RowDaySelect({ employee }: { employee: Employee }) {
  const update = useUpdateEmployee(employee.id);

  return (
    <Select
      value={employee.weekend_day ?? DEFAULT}
      onValueChange={async (value) => {
        try {
          await update.mutateAsync({
            weekend_day: value === DEFAULT ? null : (value as Weekday),
          });
        } catch (caught) {
          toast.error(apiErrorMessage(caught, "Couldn't update that person's weekly off."));
        }
      }}
      disabled={update.isPending}
    >
      <SelectTrigger className="h-8 w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={DEFAULT}>Organization default</SelectItem>
        {WEEKDAYS.map((day) => (
          <SelectItem key={day} value={day}>
            {titleCase(day)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function WeeklyOffsSection() {
  const [search, setSearch] = useState("");
  const [teamId, setTeamId] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [bulkDay, setBulkDay] = useState<string>("");

  const user = useCurrentUser();
  const debouncedSearch = useDebouncedValue(search, 300);
  const { data: orgSettings } = useOrganizationSettings({
    enabled: user.permissions.includes("settings.manage"),
  });
  const { data: teams } = useTeams();
  const assign = useAssignWeeklyOff();

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      team_id: teamId === "all" ? undefined : Number(teamId),
      weekend_day: dayFilter === "all" ? undefined : (dayFilter as Weekday | "default"),
      per_page: 100,
    }),
    [debouncedSearch, teamId, dayFilter],
  );

  const { data, isLoading } = useEmployees(filters);
  const employees = data?.data ?? [];
  const selection = useRowSelection(employees, (employee) => employee.id);

  async function applyBulk() {
    if (!bulkDay || selection.count === 0) return;
    try {
      await assign.mutateAsync({
        employee_ids: selection.selected.map((employee) => employee.id),
        weekend_day: bulkDay === DEFAULT ? null : (bulkDay as Weekday),
      });
      toast.success(`Weekly off updated for ${selection.count} ${selection.count === 1 ? "person" : "people"}.`);
      selection.clear();
      setBulkDay("");
    } catch (caught) {
      toast.error(apiErrorMessage(caught, "Couldn't update the weekly off."));
    }
  }

  const orgDefault = orgSettings?.default_weekend_day;

  return (
    <SettingsCard contentClassName="space-y-4 pt-1">
      <p className="text-sm text-muted-foreground">
        Everyone starts on the organization default
        {orgDefault ? ` (${titleCase(orgDefault)})` : ""}. Override it for anyone who works a
        different rest day.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search people…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-48 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {(teams ?? []).map((team) => (
              <SelectItem key={team.id} value={String(team.id)}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dayFilter} onValueChange={setDayFilter}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Any weekly off" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any weekly off</SelectItem>
            <SelectItem value={DEFAULT}>On the default</SelectItem>
            {WEEKDAYS.map((day) => (
              <SelectItem key={day} value={day}>
                {titleCase(day)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <BulkBar count={selection.count} onClear={selection.clear}>
        <Select value={bulkDay} onValueChange={setBulkDay}>
          <SelectTrigger className="h-8 w-44">
            <SelectValue placeholder="Set weekly off to…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT}>Organization default</SelectItem>
            {WEEKDAYS.map((day) => (
              <SelectItem key={day} value={day}>
                {titleCase(day)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={applyBulk} disabled={!bulkDay || assign.isPending}>
          Apply
        </Button>
      </BulkBar>

      {isLoading ? (
        <PageLoadingSkeleton />
      ) : employees.length === 0 ? (
        <EmptyState title="No people match" description="Try a different team or search." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selection.allSelected || (selection.someSelected && "indeterminate")}
                    onCheckedChange={selection.toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Team</TableHead>
                <TableHead>Weekly off</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Checkbox
                      checked={selection.isSelected(employee.id)}
                      onCheckedChange={() => selection.toggle(employee.id)}
                      aria-label={`Select ${employee.full_name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-foreground">{employee.full_name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{employee.employee_code}</span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {employee.team?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <RowDaySelect employee={employee} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </SettingsCard>
  );
}
