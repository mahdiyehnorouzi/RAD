import { createHash } from "node:crypto";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

/** Bank reference as typed by the customer, or `null` when it is not usable. */
export function normalizeTrackingNumber(raw: string | undefined) {
  const value = latinDigits(raw ?? "")
    .replace(/[\s-]/g, "")
    .toUpperCase();
  return /^[A-Z0-9]{4,32}$/.test(value) ? value : null;
}

/**
 * Iranian mobile in the stored form `09` plus nine digits, or `null`.
 * Accepts Persian/Arabic digits and the `09`, `9`, `98`, and `0098` prefixes.
 * The same rule lives in `apps/storefront/lib/phone/iran-mobile.ts`.
 */
export function normalizePhone(raw: string | undefined) {
  const digits = latinDigits(raw ?? "").replace(/\D/g, "");
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

export function receiptHash(receiptImage: string) {
  return createHash("sha256").update(receiptImage).digest("hex");
}
