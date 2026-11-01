/**
 * Guest carts are keyed by `rad.guest`. A cookieless request used to mint a
 * new id on every call, so the first mobile page — several API calls at
 * once, before any Set-Cookie landed — could hold a work under an id the
 * browser then discarded. The next add looked like another customer.
 *
 * The cookie wins once it exists. A client-generated UUID (sent as
 * `x-rad-guest`) is adopted only while the cookie is missing, so those
 * parallel calls share one owner. It never replaces a cookie already set.
 */
const GUEST_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isGuestId(value: string | undefined | null): value is string {
  return typeof value === "string" && GUEST_ID.test(value.trim());
}

export function resolveGuestId(input: {
  cookie?: string | null;
  header?: string | null;
  mint: () => string;
}): { id: string; setCookie: boolean } {
  const cookie = input.cookie?.trim();
  if (isGuestId(cookie)) return { id: cookie, setCookie: false };
  const header = input.header?.trim();
  if (isGuestId(header)) return { id: header, setCookie: true };
  return { id: input.mint(), setCookie: true };
}
