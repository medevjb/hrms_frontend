import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/**
 * Forwards any /api/proxy/* request to the matching Laravel /api/v1/*
 * endpoint, attaching the Sanctum token from the httpOnly session cookie
 * (docs/PRD.md §92.3). This is how every client component reaches the
 * backend — the token itself never reaches client JavaScript. One handler
 * for every resource rather than a bespoke route per endpoint, the way
 * the auth routes were built before this existed.
 */
async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  const token = await getSessionToken();

  const url = `${API_URL}/${path.join("/")}${request.nextUrl.search}`;
  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.text() : undefined;

  const response = await fetch(url, {
    method: request.method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const contentType = response.headers.get("Content-Type") ?? "application/json";

  // Authorized file streams (docs/PRD.md §82 — holiday notice / payslip
  // PDFs) are binary; decoding them as text would corrupt the bytes.
  if (!contentType.includes("application/json")) {
    const headers = new Headers({ "Content-Type": contentType });
    const disposition = response.headers.get("Content-Disposition");
    if (disposition) headers.set("Content-Disposition", disposition);

    return new NextResponse(await response.arrayBuffer(), {
      status: response.status,
      headers,
    });
  }

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": contentType },
  });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
