// Mirrors backend/app/Http/Resources/Api/V1/PersonalEventResource.php.
// A private calendar note owned by one employee (docs/PRD.md §54.1) — no
// operational effect, never visible to anyone else.

export type PersonalEvent = {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
};
