import type { Locale, Product } from "@rad/types";

/** `043` or `۰۴۳`: the bare archive digits in the reader's numerals. */
export function formatRadDigits(
  value: number,
  number: (value: number) => string,
  locale: Locale,
) {
  return number(value).padStart(3, locale === "fa" ? "۰" : "0");
}

export function formatArtworkNumber(
  product: Pick<Product, "artworkNumber">,
  number: (value: number) => string,
  locale: Locale,
) {
  const digits = product.artworkNumber?.replace(/\D/g, "");
  const value = digits ? Number(digits) : 0;
  if (!value) return "";
  return `RĀD / ${formatRadDigits(value, number, locale)}`;
}
