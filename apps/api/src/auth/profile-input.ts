import { normalizePhone } from "../orders/payment-receipt";

export const PROFILE_NAME_MIN = 2;
export const PROFILE_NAME_MAX = 80;

/** Trimmed display name, or null when it is too short or too long. */
export function normalizeProfileName(raw: string) {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < PROFILE_NAME_MIN || name.length > PROFILE_NAME_MAX) {
    return null;
  }
  return name;
}

/**
 * `undefined` means the client left the phone alone.
 * A blank value clears it. Anything else must be an Iranian mobile.
 */
export function normalizeProfilePhone(raw: string | null | undefined) {
  if (raw === undefined) return { present: false as const };
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { present: true as const, phone: null };
  const phone = normalizePhone(trimmed);
  if (!phone) return { present: true as const, phone: undefined };
  return { present: true as const, phone };
}
