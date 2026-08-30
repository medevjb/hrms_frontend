import type { DepartmentSummary, EmployeeStatus, EmploymentType, TeamSummary } from "@/types/organization";

export type Profile = {
  name: string;
  email: string;
  two_factor_enabled: boolean;
  employee: {
    employee_code: string;
    designation: string;
    employment_type: EmploymentType;
    status: EmployeeStatus;
    joining_date: string;
    department: DepartmentSummary | null;
    team: TeamSummary | null;
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
