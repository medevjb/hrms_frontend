// Mirrors backend/app/Http/Resources/Api/V1/AnnouncementResource.php and
// App\Enums\Announcement*.php (docs/PRD.md §57).

export type AnnouncementType =
  | "GENERAL"
  | "HR_NOTICE"
  | "HOLIDAY"
  | "PAYROLL"
  | "POLICY"
  | "EMERGENCY"
  | "TEAM";

export type AnnouncementStatus = "DRAFT" | "PUBLISHED" | "EXPIRED";

export type AnnouncementAudienceType = "ALL" | "DEPARTMENT" | "TEAM" | "ROLE" | "SELECTED";

export type AnnouncementTargetType = "DEPARTMENT" | "TEAM" | "ROLE" | "EMPLOYEE";

export type Announcement = {
  id: number;
  type: AnnouncementType;
  title: string;
  content: string;
  audience_type: AnnouncementAudienceType;
  status: AnnouncementStatus;
  acknowledgement_required: boolean;
  attachment_path: string | null;
  publish_at: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_by?: { id: number; name: string };
  targets?: { target_type: AnnouncementTargetType; target_id: number }[];
  read_count?: number;
  acknowledged_count?: number;
  my_read?: { acknowledged: boolean; read_at: string | null } | null;
  created_at: string | null;
};
