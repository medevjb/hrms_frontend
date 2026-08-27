import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

/** Lets client components ask "who's logged in" without ever touching the httpOnly token cookie themselves. */
export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json({ user });
}
