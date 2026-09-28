const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Accepts an order number the way customers type it (`rad-104233`,
 * `۱۰۴۲۳۳`, ` RAD 104233 `) and returns the stored id, or null when empty.
 */
export function normalizeOrderReference(raw?: string | null) {
  const value = (raw ?? "")
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[\s#]/g, "")
    .toUpperCase();
  if (!value) return null;
  if (/^\d+$/.test(value)) return `RAD-${value}`;
  const prefixed = value.match(/^RAD-?(\d+)$/);
  return prefixed ? `RAD-${prefixed[1]}` : value;
}
