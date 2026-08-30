// Mirrors backend/app/Enums/HolidayType.php and HolidayResource.php.

export type HolidayType = "NATIONAL" | "RELIGIOUS" | "COMPANY" | "OTHER";

export type Holiday = {
  id: number;
  title: string;
  date: string;
  type: HolidayType;
  description: string | null;
  office_location: string | null;
  active: boolean;
};

// Mirrors backend/app/Http/Resources/Api/V1/HolidayNoticeResource.php and
// App\Enums\HolidayNoticeStatus.php (docs/PRD.md §55, §56).

export type HolidayNoticeStatus = "PENDING_APPROVAL" | "PUBLISHED" | "DISMISSED";

export type HolidayNotice = {
  id: number;
  reference: string;
  status: HolidayNoticeStatus;
  title: string;
  message: string;
  closure_note: string | null;
  return_date: string | null;
  signatory_name: string | null;
  generated_at: string | null;
  has_document: boolean;
  announcement_id: number | null;
  holiday: { id: number; title: string; date: string; type: HolidayType };
  created_at: string | null;
};
