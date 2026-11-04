export const AUTH_COOKIE = "rad.auth";
export const GUEST_COOKIE = "rad.guest";
/** Short-lived: holds the Google OAuth `state` + PKCE verifier + return path between redirect and callback. */
export const GOOGLE_OAUTH_COOKIE = "rad.google_oauth";

export function sessionCookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeMs,
  };
}

/** Lax (not Strict): Google's redirect back to /auth/google/callback is a top-level GET navigation from their domain. */
export function oauthCookieOptions(maxAgeMs: number) {
  return sessionCookieOptions(maxAgeMs);
}
