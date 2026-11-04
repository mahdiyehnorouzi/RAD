/**
 * Where the Google OAuth callback sends the browser back to. Deliberately
 * narrow — the same `STOREFRONT_ORIGIN` env var every other cross-origin
 * redirect in this API already uses (see `cors-origins.ts`,
 * `OrdersService`'s gateway `callbackUrl`), never a client-supplied host —
 * so the `?from=` path on `GET /auth/google` can only ever produce a
 * same-site redirect, not an open redirect to an attacker's domain.
 */
export function storefrontOrigin(env: NodeJS.ProcessEnv = process.env) {
  return env.STOREFRONT_ORIGIN?.replace(/\/+$/, "") || "http://localhost:3000";
}

/** Only a same-site relative path (`/...`) is accepted; anything else falls back to `/`. */
export function safeReturnPath(path: unknown) {
  if (typeof path !== "string") return "/";
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}
