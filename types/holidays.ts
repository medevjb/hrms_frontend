// Mirrors backend/app/Enums/HolidayType.php and HolidayResource.php.

export type HolidayType = "NATIONAL" | "RELIGIOUS" | "COMPANY" | "OTHER";

// MANUAL — added by hand; GOOGLE_BD — pulled from Google's public
// "Holidays in Bangladesh" calendar by the holidays:import-bd importer.
export type HolidaySource = "MANUAL" | "GOOGLE_BD";

export type Holiday = {
  id: number;
  title: string;
  date: string;
  type: HolidayType;
  description: string | null;
  office_location: string | null;
  active: boolean;
  source: HolidaySource;
  synced_at: string | null;
};

// Result of POST /holidays/import.
export type HolidayImportResult = {
  created: number;
  updated: number;
  skipped: number;
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
