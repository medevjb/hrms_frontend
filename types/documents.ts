// Mirrors backend/app/Enums/DocumentCategory.php and DocumentResource.php (docs/PRD.md §82).

export type DocumentCategory =
  | "CONTRACT"
  | "IDENTIFICATION"
  | "CERTIFICATION"
  | "PERFORMANCE"
  | "OTHER";

export type EmployeeDocument = {
  id: number;
  employee_id: number;
  title: string;
  category: DocumentCategory;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string | null;
};
