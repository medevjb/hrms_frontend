import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { apiErrorToResponse } from "@/lib/api-route-response";
import { setSessionCookie } from "@/lib/session";
import type { CurrentUser } from "@/types/auth";

type LoginResult =
  | { two_factor: true; challenge_id: string }
  | { token: string; user: CurrentUser; expires_at: string | null };

/**
 * Proxies POST /api/v1/auth/login. On success, the Sanctum token is stored
 * in an httpOnly cookie here — server-side only — never returned to the
 * client (docs/PRD.md §92.3). The client only ever sees the user object,
 * or a 202 two-factor challenge id to complete next.
 */
export async function POST(request: Request) {
  const body = await request.json();

  try {
    const result = await apiFetch<LoginResult>("/auth/login", {
      method: "POST",
      body,
    });

    if ("two_factor" in result) {
      return NextResponse.json(result, { status: 202 });
    }

    await setSessionCookie(result.token, result.expires_at);

    return NextResponse.json({ user: result.user });
  } catch (error) {
    return apiErrorToResponse(error);
  }
}
