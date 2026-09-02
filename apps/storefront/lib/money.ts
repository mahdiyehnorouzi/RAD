import type { Locale } from "@rad/types";
import type { Product } from "@/lib/products";

export function priceToNumber(price: string) {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  return Number(
    price
      .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
      .replace(/[^0-9]/g, ""),
  );
}

export function formatToman(value: number) {
  return `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;
}

export function productPrice(product: Product, locale: Locale) {
  return locale === "fa"
    ? product.price
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(product.usdPrice);
}

export function cartTotal(products: Product[], locale: Locale) {
  return products.reduce(
    (sum, product) =>
      sum + (locale === "fa" ? priceToNumber(product.price) : product.usdPrice),
    0,
  );
}

export function formatTotal(value: number, locale: Locale) {
  return locale === "fa"
    ? formatToman(value)
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
}
