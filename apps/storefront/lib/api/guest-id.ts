/** Must match `isGuestId` in the API (`apps/api/src/common/guest-id.ts`). */
const GUEST_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const GUEST_STORAGE_KEY = "rad-guest-id";

type GuestStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/** One id per browser, reused by every in-flight call before the cookie exists. */
export function readOrCreateGuestId(
  storage: GuestStorage,
  mint: () => string,
): string {
  const existing = storage.getItem(GUEST_STORAGE_KEY);
  if (existing && GUEST_ID.test(existing)) return existing;
  const created = mint();
  if (!GUEST_ID.test(created)) {
    throw new Error("guest id must be a UUID");
  }
  storage.setItem(GUEST_STORAGE_KEY, created);
  return created;
}

export function browserGuestId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return readOrCreateGuestId(window.localStorage, () => crypto.randomUUID());
  } catch {
    return null;
  }
}
