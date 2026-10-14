const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

/**
 * Iranian mobile numbers only: `09XXXXXXXXX`, `+989XXXXXXXXX` or
 * `989XXXXXXXXX`, after normalizing Persian/Arabic digits and stripping
 * spaces/dashes. Returns the canonical `09XXXXXXXXX` form, or `null` when
 * the number isn't a valid Iranian mobile number. This is the real
 * business rule — the DTO only applies a sanity length bound.
 */
export function normalizeIranMobile(raw: string | undefined) {
  const value = latinDigits(raw ?? "").replace(/[\s-]/g, "");
  const match = /^(?:\+98|0098|98|0)?(9\d{9})$/.exec(value);
  return match ? `0${match[1]}` : null;
}
