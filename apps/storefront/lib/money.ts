import type { Locale } from "@rad/types";
import type { Product } from "@rad/types";

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

/**
 * Settlement is always in Toman via card-to-card bank transfer, regardless
 * of UI locale — there is no real USD payment path. English copy must not
 * imply a dollar amount, so it formats the same Toman figure with Latin
 * digits instead of converting to `usdPrice` (which is only a rough
 * reference figure, not something the buyer can actually pay).
 */
export function productPrice(product: Product, locale: Locale) {
  return locale === "fa"
    ? product.price
    : `${new Intl.NumberFormat("en-US").format(priceToNumber(product.price))} toman`;
}

/** Whole price with its unit apart: `۴٬۵۰۰٬۰۰۰` + `تومان`, or `4,500,000` + `toman`. */
export function productFullPriceParts(product: Product, locale: Locale) {
  const amountDigits = new Intl.NumberFormat(
    locale === "fa" ? "fa-IR" : "en-US",
  ).format(priceToNumber(product.price));
  return {
    amount: amountDigits,
    unit: locale === "fa" ? "تومان" : "toman",
  };
}

export function cartTotal(products: Product[]) {
  return products.reduce(
    (sum, product) => sum + priceToNumber(product.price),
    0,
  );
}

export function formatTotal(value: number, locale: Locale) {
  return locale === "fa"
    ? formatToman(value)
    : `${new Intl.NumberFormat("en-US").format(value)} toman`;
}
