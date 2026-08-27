import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { clearSessionCookie, getSessionToken } from "@/lib/session";

/** Revokes the current Sanctum token server-side, then clears the session cookie regardless of whether the revoke call succeeds — a stale/already-expired token shouldn't strand the user logged in on the frontend. */
export async function POST() {
  const token = await getSessionToken();

  if (token) {
    await apiFetch("/auth/logout", { method: "POST", token }).catch(() => undefined);
  }

  await clearSessionCookie();

  return NextResponse.json({ success: true });
}
