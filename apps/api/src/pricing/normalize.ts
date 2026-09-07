const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
const stopWords = new Set([
  "از",
  "با",
  "برای",
  "در",
  "به",
  "و",
  "the",
  "a",
  "an",
  "of",
  "with",
]);

export function latinDigits(value: string) {
  return [...value]
    .map((char) => {
      const p = persianDigits.indexOf(char);
      if (p >= 0) return String(p);
      const a = arabicDigits.indexOf(char);
      return a >= 0 ? String(a) : char;
    })
    .join("");
}

export function normalizeText(value: string) {
  return latinDigits(value)
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/[^\p{L}\p{N}.]+/gu, " ")
    .trim();
}

export function tokens(value: string) {
  return new Set(
    normalizeText(value)
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopWords.has(word)),
  );
}

export function parsePrice(value: string, currency: "IRR" | "IRT") {
  const matches = latinDigits(value)
    .replace(/[,.٬،\s]/g, "")
    .match(/\d+/g);
  if (!matches?.length) return null;
  let amount = Number(matches.sort((a, b) => b.length - a.length)[0]);
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;
  if (currency === "IRR") amount = Math.round(amount / 10);
  return amount;
}

export function textFromUnknown(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(textFromUnknown);
  if (typeof value === "string") return [value];
  if (value && typeof value === "object")
    return Object.values(value).flatMap(textFromUnknown);
  return [];
}
