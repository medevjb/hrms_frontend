"use client";

import { useId, useMemo, useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { useEmployee, useEmployees } from "@/services/employees";

/**
 * Picks one employee (team leader, ops manager, "viewing", a filter, …).
 * Search-as-you-type against `/employees` — `filter[search]` matches name,
 * code, designation, and email server-side, so it scales past the first
 * page. The label of an already-picked employee is resolved even when the
 * current search results no longer include them.
 */
export function EmployeeSelect({
  label,
  value,
  onChange,
  placeholder = "Select an employee",
}: {
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 250);

  const { data, isFetching } = useEmployees({
    search: debouncedQuery || undefined,
    sort: "name",
    per_page: 25,
  });
  const employees = useMemo(() => data?.data ?? [], [data]);

  // Resolve the picked employee's label independently of the search list.
  const preset = useEmployee(value ? Number(value) : Number.NaN);
  const selectedLabel = useMemo(() => {
    if (!value) return null;
    const inResults = employees.find((employee) => String(employee.id) === value);
    const resolved = inResults ?? (preset.data?.id === Number(value) ? preset.data : null);
    return resolved ? `${resolved.full_name} (${resolved.employee_code})` : null;
  }, [value, employees, preset.data]);

  function pick(employeeId: number) {
    onChange(String(employeeId));
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            className={cn(
              "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50",
              !selectedLabel && "text-muted-foreground",
            )}
          >
            <span className="truncate">{selectedLabel ?? placeholder}</span>
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[max(var(--radix-popover-trigger-width),15rem)] gap-0 p-0"
        >
          <div className="flex items-center gap-2 border-b border-border px-2.5">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, code, or email"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {isFetching && <Loader2Icon className="size-3.5 shrink-0 animate-spin text-muted-foreground" />}
          </div>
          <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto p-1">
            {employees.length === 0 ? (
              <li className="px-2 py-6 text-center text-xs text-muted-foreground">
                {isFetching
                  ? "Searching…"
                  : debouncedQuery
                    ? "No matching employees."
                    : "No employees."}
              </li>
            ) : (
              employees.map((employee) => {
                const isSelected = value === String(employee.id);
                return (
                  <li key={employee.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => pick(employee.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent/60",
                      )}
                    >
                      <CheckIcon
                        className={cn("size-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {employee.full_name}
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {employee.employee_code}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
