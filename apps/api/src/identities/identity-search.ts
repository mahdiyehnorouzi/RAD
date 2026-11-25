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
   * zeros stripped. `null` unless the *entire* query — after that
   * normalization — is nothing but a RAD code, so this is never a
   * substring plucked out of an otherwise-alphanumeric query: a product
   * literally named "model 82" or an artist's name that happens to
   * contain a number must stay a plain name search, not also match
   * identity #82.
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
  // Strip an optional "RAD" prefix (RAD-014, rad 014, RAD014 — case and
  // spacing insensitive) only as a candidate; it's accepted below only if
  // everything left after it is purely numeric, so a product name that
  // merely starts with "rad" is never mistaken for a code.
  const withoutPrefix = ascii.replace(/^rad[\s-]*/i, "");
  const isWholeQueryNumeric = /^\d+$/.test(withoutPrefix);
  const withoutLeadingZeros = isWholeQueryNumeric
    ? withoutPrefix.replace(/^0+(?=\d)/, "")
    : null;
  return {
    raw: trimmed,
    radNumber: withoutLeadingZeros,
  };
}
