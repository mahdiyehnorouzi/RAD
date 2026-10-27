/**
 * Where the Google OAuth callback sends the browser back to. Deliberately
 * narrow — a single configured/default origin, never a client-supplied
 * host — so the `?from=` path on `GET /auth/google` can only ever produce
 * a same-site redirect, not an open redirect to an attacker's domain.
 */
export function storefrontOrigin(env: NodeJS.ProcessEnv = process.env) {
  return (
    env.STOREFRONT_ORIGIN?.replace(/\/+$/, "") ||
    (env.NODE_ENV === "production"
      ? "https://www.rad-object.com"
      : "http://localhost:3000")
  );
}

/** Only a same-site relative path (`/...`) is accepted; anything else falls back to `/`. */
export function safeReturnPath(path: unknown) {
  if (typeof path !== "string") return "/";
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}
