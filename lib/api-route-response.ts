import "server-only";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-error";

/** Turns an ApiError from apiFetch into the same {message, errors, code} shape the Laravel API itself returns, so route handlers stay transparent proxies. */
export function apiErrorToResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { message: error.message, errors: error.errors, code: error.code },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { message: "Unexpected error", code: "UNKNOWN_ERROR" },
    { status: 500 },
  );
}
