// Mirrors backend/app/Enums/{EmployeeStatus,EmploymentType}.php — keep in
// sync by hand, per docs/PRD.md §5.3.

export type EmployeeStatus =
  | "INVITED"
  | "ACTIVE"
  | "PROBATION"
  | "NOTICE_PERIOD"
  | "SUSPENDED"
  | "RESIGNED"
  | "TERMINATED"
  | "ARCHIVED";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

export type EmployeeSummary = { id: number; full_name: string };
export type TeamSummary = { id: number; name: string };
export type DepartmentSummary = { id: number; name: string };

export type Employee = {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  profile_image_path: string | null;
  phone: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  joining_date: string;
  designation: string;
  employment_type: EmploymentType;
  status: EmployeeStatus;
  confirmation_date: string | null;
  office_location: string | null;
  timezone: string | null;
  overtime_eligible: boolean;
  department: DepartmentSummary | null;
  team: TeamSummary | null;
  team_leader: EmployeeSummary | null;
  operation_manager: EmployeeSummary | null;
  current_shift: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
};

export type Department = {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  operation_manager: EmployeeSummary | null;
};

export type Team = {
  id: number;
  name: string;
  active: boolean;
  department: DepartmentSummary;
  team_leader: EmployeeSummary | null;
  member_count: number | null;
};

export type TeamMember = {
  id: number;
  employee: { id: number; full_name: string; employee_code: string };
  started_at: string;
  ended_at: string | null;
};
