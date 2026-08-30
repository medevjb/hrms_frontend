import type { ApiErrorBody } from "@/types/api";

// Thrown by apiFetch for any non-2xx response. TanStack Query call sites can
// switch on `.code` (docs/PRD.md §139.2) rather than parsing `.message` text.
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors?: Record<string, string[]>;
  readonly data?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.errors = body.errors;
    this.data = body.data;
  }
}

/**
 * The message to show for a failed mutation. A guarded delete answers 409
 * with a human-readable reason ("still has teams", "used in a salary") — we
 * surface that verbatim; anything else falls back to a generic line.
 */
export function apiErrorMessage(caught: unknown, fallback: string): string {
  return caught instanceof ApiError && caught.message ? caught.message : fallback;
}
