import { ApiError } from "@/lib/api-error";
import type { ApiErrorBody, ApiSuccess } from "@/types/api";

export type BrowserFetchOptions = Omit<RequestInit, "body"> & { body?: unknown };

/**
 * Client-component counterpart to lib/api-client.ts's apiFetch — goes
 * through /api/proxy instead of talking to Laravel directly, since a
 * browser has no way to attach the httpOnly session cookie's token itself.
 */
export async function browserFetch<T>(
  path: string,
  { body, headers, ...init }: BrowserFetchOptions = {},
): Promise<T> {
  const response = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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
