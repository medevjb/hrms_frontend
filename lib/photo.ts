/**
 * A `photo_url` from the API is a relative path onto the authenticated
 * image stream (`/auth/profile/photo?v=…`). The browser can't reach the
 * backend directly, so it goes through the proxy like every other call.
 */
export function photoSrc(photoUrl: string | null | undefined): string | undefined {
  return photoUrl ? `/api/proxy${photoUrl}` : undefined;
}
