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

export function toLocaleDigits(raw: string, locale: "fa" | "en") {
  return locale === "fa"
    ? raw.replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)])
    : raw;
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
