const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Search key for Persian product text. Display strings and stored values
 * stay unchanged; only comparisons use this form.
 */
export function normalizePersianSearch(value: string) {
  const withoutMarks = value.normalize("NFKD").replace(/\p{M}/gu, "");
  return Array.from(withoutMarks)
    .map((char) => {
      const persianIndex = PERSIAN_DIGITS.indexOf(char);
      if (persianIndex >= 0) return String(persianIndex);
      const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(char);
      if (arabicIndex >= 0) return String(arabicIndex);
      if (char === "ي" || char === "ى") return "ی";
      if (char === "ك") return "ک";
      if (char === "\u200c" || char === "\u200d") return "";
      return char;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function persianSearchIncludes(haystack: string, query: string) {
  const needle = normalizePersianSearch(query);
  if (!needle) return true;
  return normalizePersianSearch(haystack).includes(needle);
}
