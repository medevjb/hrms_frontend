import type { ApiErrorBody } from "@/types/api";

// Thrown by apiFetch for any non-2xx response. TanStack Query call sites can
// switch on `.code` (docs/PRD.md §139.2) rather than parsing `.message` text.
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors?: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.errors = body.errors;
  }
}
