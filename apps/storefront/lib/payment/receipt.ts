export const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const RECEIPT_MAX_BYTES = 1024 * 1024;

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Persian and Arabic-Indic digits to ASCII. */
export function toLatinDigits(raw: string) {
  return raw
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

export function normalizeTrackingNumber(raw: string) {
  const value = toLatinDigits(raw).replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{4,32}$/.test(value) ? value : null;
}

export function isReceiptFile(file: File) {
  return (
    RECEIPT_TYPES.includes(file.type) &&
    file.size > 0 &&
    file.size <= RECEIPT_MAX_BYTES
  );
}

export function readReceiptFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** `6104337812345678` → `["6104", "3378", "1234", "5678"]`. */
export function cardNumberGroups(raw: string) {
  return (
    toLatinDigits(raw)
      .replace(/\D/g, "")
      .match(/.{1,4}/g) ?? []
  );
}

/** Digits only — what «کپی شماره کارت» writes to the clipboard. */
export function cardDigitsForCopy(raw: string) {
  return cardNumberGroups(raw).join("");
}

/** Split a printed cardholder name onto two lines (given name / family name). */
export function holderNameLines(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return [trimmed];
  return [parts.slice(0, -1).join(" "), parts[parts.length - 1]!];
}
