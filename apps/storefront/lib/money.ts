import type {Locale} from "@rad/types";
import type {Product} from "@rad/types";

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

export function formatTomanMillionsParts(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return {
      amount: new Intl.NumberFormat("fa-IR").format(0),
      unit: "تومان",
    };
  }
  if (value < 1_000_000) {
    return {
      amount: new Intl.NumberFormat("fa-IR").format(value),
      unit: "تومان",
    };
  }
  const millions = value / 1_000_000;
  const formatted = new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: Number.isInteger(millions) ? 0 : 1,
  }).format(millions);
  return { amount: `${formatted} میلیون`, unit: "تومان" };
}

export function formatTomanMillions(value: number) {
  const { amount, unit } = formatTomanMillionsParts(value);
  return `${amount} ${unit}`;
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

export function productCardPrice(product: Product, locale: Locale) {
  return locale === "fa"
    ? formatTomanMillions(priceToNumber(product.price))
    : productPrice(product, locale);
}

export function productCardPriceParts(product: Product, locale: Locale) {
  if (locale !== "fa") {
    return { amount: productPrice(product, locale), unit: null };
  }
  return formatTomanMillionsParts(priceToNumber(product.price));
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
