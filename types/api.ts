// Mirrors the backend envelope in docs/PRD.md §139 — every response from
// /api/v1 follows one of these two shapes.

export type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorBody = {
  message: string;
  errors?: Record<string, string[]>;
  code: string;
  // §139.5 — a 409 conflict (e.g. ALREADY_CHECKED_IN) carries the existing
  // resource here, so the frontend can render correct state from the
  // error alone instead of following up with a GET.
  data?: unknown;
};

export type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};
