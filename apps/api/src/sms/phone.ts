const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

/**
 * An Iranian mobile number as `09xxxxxxxxx` (the shape Melipayamak's `to`
 * parameter and the rest of this service expect), or `null` if it isn't
 * one. Accepts `0912...`, `+98912...`, `0098912...`, `98912...`, with
 * Persian/Arabic digits or spaces/dashes.
 */
export function normalizeIranianMobile(raw: string | undefined): string | null {
  const digits = latinDigits(raw ?? "").replace(/[^\d+]/g, "");
  const stripped = digits.replace(/^\+/, "");
  const withoutCountry = stripped.startsWith("0098")
    ? `0${stripped.slice(4)}`
    : stripped.startsWith("98")
      ? `0${stripped.slice(2)}`
      : stripped;
  return /^09\d{9}$/.test(withoutCountry) ? withoutCountry : null;
}
