import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { apiErrorToResponse } from "@/lib/api-route-response";
import { setSessionCookie } from "@/lib/session";
import type { CurrentUser } from "@/types/auth";

type ChallengeResult = {
  token: string;
  user: CurrentUser;
  expires_at: string | null;
};

/** Proxies POST /api/v1/auth/two-factor-challenge, completing the login started by /api/auth/login. */
export async function POST(request: Request) {
  const body = await request.json();

  try {
    const result = await apiFetch<ChallengeResult>("/auth/two-factor-challenge", {
      method: "POST",
      body,
    });

    await setSessionCookie(result.token, result.expires_at);

    return NextResponse.json({ user: result.user });
  } catch (error) {
    return apiErrorToResponse(error);
  }
}
