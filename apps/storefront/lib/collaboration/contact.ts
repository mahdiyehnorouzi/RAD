const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toLatinDigits(raw: string) {
  return raw
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

/**
 * Mirrors the API's `normalizeIranMobile` (apps/api/src/artist-applications/contact.ts)
 * so the wizard can reject an invalid number before the user reaches the
 * last step — the API remains the source of truth and re-validates on submit.
 */
export function normalizeIranMobile(raw: string) {
  const value = toLatinDigits(raw).replace(/[\s-]/g, "");
  const match = /^(?:\+98|0098|98|0)?(9\d{9})$/.exec(value);
  return match ? `0${match[1]}` : null;
}
