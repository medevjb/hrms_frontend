"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-error";
import { useCreateEmployee } from "@/services/employees";
import type { EmploymentType } from "@/types/organization";

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
];

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  designation: z.string().min(1, "Designation is required"),
  employment_type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
  joining_date: z.string().min(1, "Joining date is required"),
});

function Form({ onClose }: { onClose: () => void }) {
  const createEmployee = useCreateEmployee();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("FULL_TIME");
  const [joiningDate, setJoiningDate] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = schema.safeParse({
      email,
      first_name: firstName,
      last_name: lastName,
      designation,
      employment_type: employmentType,
      joining_date: joiningDate ?? "",
    });

    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""]),
        ),
      );
      return;
    }

    try {
      await createEmployee.mutateAsync({
        ...parsed.data,
        phone: phone.trim() || undefined,
      });
      toast.success(`Invitation sent to ${parsed.data.first_name} ${parsed.data.last_name}`);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="First name" htmlFor="first_name" error={fieldErrors.first_name}>
          <Input
            id="first_name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoFocus
          />
        </FormField>
        <FormField label="Last name" htmlFor="last_name" error={fieldErrors.last_name}>
          <Input id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </FormField>
      </div>
      <FormField
        label="Work email"
        htmlFor="email"
        error={fieldErrors.email}
        description="Where the invitation link is sent"
      >
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Designation" htmlFor="designation" error={fieldErrors.designation}>
          <Input
            id="designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />
        </FormField>
        <FormField label="Phone" htmlFor="phone" error={fieldErrors.phone} description="Optional">
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Employment type" error={fieldErrors.employment_type}>
          <Select
            value={employmentType}
            onValueChange={(v) => setEmploymentType(v as EmploymentType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Joining date" htmlFor="joining_date" error={fieldErrors.joining_date}>
          <DatePicker id="joining_date" value={joiningDate} onChange={setJoiningDate} />
        </FormField>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createEmployee.isPending}>
          {createEmployee.isPending ? "Sending…" : "Send invitation"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function InviteEmployeeDialog({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite an employee</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email to set a password and finish their profile.
          </DialogDescription>
        </DialogHeader>
        {opened && <Form key="invite-employee" onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
