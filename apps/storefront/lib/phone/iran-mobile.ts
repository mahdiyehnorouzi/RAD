import { toLatinDigits } from "@/lib/payment/receipt";

/**
 * Iranian mobile numbers, stored as `09` and nine more digits.
 * The same rule lives in `apps/api/src/orders/payment-receipt.ts`.
 */
export function canonicalIranMobile(raw: string | undefined | null) {
  const digits = toLatinDigits(raw ?? "").replace(/\D/g, "");
  let national = "";
  if (digits.startsWith("0098")) {
    if (digits.length !== 14) return null;
    national = digits.slice(4);
  } else if (digits.startsWith("98")) {
    if (digits.length !== 12) return null;
    national = digits.slice(2);
  } else if (digits.startsWith("09")) {
    if (digits.length !== 11) return null;
    national = digits.slice(1);
  } else if (digits.startsWith("9")) {
    if (digits.length !== 10) return null;
    national = digits;
  } else {
    return null;
  }
  return /^9\d{9}$/.test(national) ? `0${national}` : null;
}

/** Latin digits, grouped `0912 123 4567` once a leading zero is present. */
export function formatIranMobileDraft(raw: string) {
  let digits = toLatinDigits(raw).replace(/\D/g, "");
  if (digits.startsWith("0098")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("98") && digits.length >= 12) {
    digits = `0${digits.slice(2)}`;
  }
  digits = digits.slice(0, 11);
  if (!digits.startsWith("0")) return digits;
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export function iranMobileMessage(
  raw: string,
  interacted: boolean,
  copy: { empty: string; invalid: string },
) {
  if (!interacted) return undefined;
  if (!raw.trim()) return copy.empty;
  if (!canonicalIranMobile(raw)) return copy.invalid;
  return undefined;
}
