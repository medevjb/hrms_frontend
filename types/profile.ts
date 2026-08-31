import type { DepartmentSummary, EmployeeStatus, EmploymentType, TeamSummary } from "@/types/organization";
import type { Weekday } from "@/types/settings";

// Mirrors backend/app/Http/Resources/Api/V1/ProfileResource.php — the
// signed-in user's own record: the contact fields they edit, plus all the
// employment context HR owns, read-only. No salary, payroll, or documents.
export type Profile = {
  name: string;
  email: string;
  two_factor_enabled: boolean;
  photo_url: string | null;
  employee: {
    employee_code: string;
    designation: string;
    employment_type: EmploymentType;
    status: EmployeeStatus;
    joining_date: string;
    confirmation_date: string | null;
    office_location: string | null;
    timezone: string | null;
    weekend_day: Weekday | null;
    overtime_eligible: boolean;
    department: DepartmentSummary | null;
    team: TeamSummary | null;
    current_shift: { id: number; name: string } | null;
    team_leader: { id: number; full_name: string } | null;
    operation_manager: { id: number; full_name: string } | null;
    phone: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
  } | null;
};

export type UpdateProfileInput = {
  name: string;
  phone?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};

export type ChangePasswordInput = {
  current_password: string;
  password: string;
  password_confirmation: string;
};
