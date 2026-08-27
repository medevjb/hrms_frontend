import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { apiErrorToResponse } from "@/lib/api-route-response";

/** Proxies POST /api/v1/auth/reset-password. The token/email pair comes from the link the user clicked in their email — see (auth)/reset-password/page.tsx. */
export async function POST(request: Request) {
  const body = await request.json();

  try {
    const result = await apiFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body,
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorToResponse(error);
  }
}
