import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/**
 * Profile photo upload/removal. Multipart can't go through /api/proxy
 * (which re-serializes bodies as JSON), so it gets its own route that
 * forwards the file with the session token attached (docs/PRD.md §92.3).
 */
export async function POST(request: Request) {
  const token = await getSessionToken();
  const incoming = await request.formData();
  const photo = incoming.get("photo");

  const form = new FormData();
  if (photo) form.append("photo", photo);

  const response = await fetch(`${API_URL}/auth/profile/photo`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE() {
  const token = await getSessionToken();

  const response = await fetch(`${API_URL}/auth/profile/photo`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
