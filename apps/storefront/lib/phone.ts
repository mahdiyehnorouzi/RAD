const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

/**
 * Client-side mirror of the API's `normalizeIranianMobile` (same shape:
 * `09xxxxxxxxx`) — used only to show an immediate, friendly validation
 * error before a request leaves the browser. The API re-validates with its
 * own copy regardless; this is never the source of truth.
 */
export function normalizeIranianMobile(raw: string): string | null {
  const digits = latinDigits(raw).replace(/[^\d+]/g, "");
  const stripped = digits.replace(/^\+/, "");
  const withoutCountry = stripped.startsWith("0098")
    ? `0${stripped.slice(4)}`
    : stripped.startsWith("98")
      ? `0${stripped.slice(2)}`
      : stripped;
  return /^09\d{9}$/.test(withoutCountry) ? withoutCountry : null;
}
