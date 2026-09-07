import type { Locale, Product } from "@rad/types";

export function formatArtworkNumber(
  product: Pick<Product, "artworkNumber">,
  number: (value: number) => string,
  locale: Locale,
) {
  const digits = product.artworkNumber?.replace(/\D/g, "");
  const value = digits ? Number(digits) : 0;
  if (!value) return "";
  return `RĀD / ${number(value).padStart(3, locale === "fa" ? "۰" : "0")}`;
}
