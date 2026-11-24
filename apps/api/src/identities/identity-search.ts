const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toAsciiDigits(value: string): string {
  return Array.from(value)
    .map((char) => {
      const persianIndex = PERSIAN_DIGITS.indexOf(char);
      if (persianIndex >= 0) return String(persianIndex);
      const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(char);
      if (arabicIndex >= 0) return String(arabicIndex);
      return char;
    })
    .join("");
}

export interface IdentitySearchQuery {
  /** The trimmed raw text, used as-is for the product-name match. */
  raw: string;
  /**
   * Digits to match against `identity.radNumber`: Persian/Arabic-Indic
   * digits normalized to ASCII, an optional "RAD" prefix and leading
   * zeros stripped. `null` when the query has no digits at all (a
   * plain product-name search).
   */
  radNumber: string | null;
}

/**
 * Normalizes an admin "search" box query for the QR/identity list.
 * `identity.radNumber` is a plain, unpadded integer column — the admin
 * panel displays it zero-padded via `formatRadCode`/`RAD-014`-style
 * labels, and Persian keyboards produce Persian digits by default, so a
 * raw `CAST(radNumber AS text) LIKE` match against the untouched input
 * silently never matches "۰۱۴", "RAD-014", or "014" (vs. the stored
 * "14").
 */
export function parseIdentitySearchQuery(raw: string): IdentitySearchQuery {
  const trimmed = raw.trim();
  const ascii = toAsciiDigits(trimmed);
  const withoutPrefix = ascii.replace(/^rad[\s-]*/i, "");
  const digitsOnly = withoutPrefix.replace(/\D/g, "");
  const withoutLeadingZeros = digitsOnly.replace(/^0+(?=\d)/, "");
  return {
    raw: trimmed,
    radNumber: withoutLeadingZeros || null,
  };
}
