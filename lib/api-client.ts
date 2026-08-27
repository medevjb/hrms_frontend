import { ApiError } from "@/lib/api-error";
import type { ApiErrorBody, ApiSuccess } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /**
   * Bearer token for this request. Phase 1's auth module is responsible for
   * where this comes from — per docs/PRD.md §92.3 the plan is a Next.js
   * Route Handler holding the token in an httpOnly cookie and proxying
   * requests server-side, so it never lives in client-readable storage.
   * This client only knows how to attach whatever token it's given.
   */
  token?: string | null;
  /** Called on a 401 response, e.g. to redirect to /login. */
  onUnauthorized?: () => void;
};

/**
 * Thin wrapper around fetch() for /api/v1: attaches the bearer token,
 * unwraps the {data, meta} envelope, and throws ApiError with the
 * {message, errors, code} shape on failure (docs/PRD.md §139).
 */
export async function apiFetch<T>(
  path: string,
  { body, token, onUnauthorized, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    onUnauthorized?.();
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;

    throw new ApiError(
      response.status,
      errorBody ?? { message: response.statusText, code: "UNKNOWN_ERROR" },
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiSuccess<T>;

  return payload.data;
}
