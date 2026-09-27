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
  const value = latinDigits(raw ?? "").replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{4,32}$/.test(value) ? value : null;
}

/** Digits-only phone, or `null` when it cannot reach the customer. */
export function normalizePhone(raw: string | undefined) {
  const value = latinDigits(raw ?? "").replace(/[^\d+]/g, "");
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? value : null;
}

export function receiptHash(receiptImage: string) {
  return createHash("sha256").update(receiptImage).digest("hex");
}
