import "server-only";
import type { Branding } from "@/types/settings";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const FALLBACK: Branding = {
  company_name: "Agency HRM",
  app_title: "Agency HRM",
  logo_url: null,
  favicon_url: null,
};

/**
 * The organization's public identity — company name, app title, logo and
 * favicon URLs (§85). Served without a session so the sign-in screen and
 * the browser tab render branded before anyone logs in. Falls back to the
 * built-in name if the API is unreachable, so the app still renders.
 */
export async function getBranding(): Promise<Branding> {
  try {
    const response = await fetch(`${API_URL}/branding`, { next: { revalidate: 60 } });
    if (!response.ok) return FALLBACK;
    return (await response.json()) as Branding;
  } catch {
    return FALLBACK;
  }
}
