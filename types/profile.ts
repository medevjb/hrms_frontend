import type {
  DepartmentSummary,
  EmployeeStatus,
  EmployeeSummary,
  EmploymentType,
  TeamSummary,
} from "@/types/organization";

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
    overtime_eligible: boolean;
    department: DepartmentSummary | null;
    team: TeamSummary | null;
    current_shift: { id: number; name: string } | null;
    team_leader: EmployeeSummary | null;
    operation_manager: EmployeeSummary | null;
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
