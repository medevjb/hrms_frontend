/**
 * The API hands back media URLs as bare `/api/v1`-relative paths
 * (`/branding/logo?v=…`, `/auth/profile/photo?v=…`). A browser <img> has
 * to reach them through the same proxy every other client request uses,
 * so the session cookie's token can be attached server-side.
 */
export function proxyMedia(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http") || path.startsWith("/api/proxy")) return path;
  return `/api/proxy${path}`;
}
