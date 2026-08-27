import "server-only";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";
import type { CurrentUser } from "@/types/auth";

// docs/PRD.md §92.3 — the Sanctum token lives in an httpOnly cookie set by a
// Route Handler and read here, server-side only. It never reaches client
// JavaScript or localStorage.
const SESSION_COOKIE = "hrm_session";

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();

  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionCookie(
  token: string,
  expiresAt: string | null,
): Promise<void> {
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt ? new Date(expiresAt) : undefined,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();

  store.delete(SESSION_COOKIE);
}

/**
 * The signed-in user, or null if there's no session or the token has been
 * revoked/expired server-side. Used by the (dashboard) layout to gate access
 * and by the login/logout route handlers.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  try {
    return await apiFetch<CurrentUser>("/auth/me", { token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}
