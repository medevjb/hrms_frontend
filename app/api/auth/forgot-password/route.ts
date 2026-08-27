import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { apiErrorToResponse } from "@/lib/api-route-response";

/** Proxies POST /api/v1/auth/forgot-password. No session involved — this runs whether or not the caller is logged in. */
export async function POST(request: Request) {
  const body = await request.json();

  try {
    const result = await apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body,
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorToResponse(error);
  }
}
