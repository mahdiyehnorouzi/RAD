"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import type { Locale } from "./i18n";

type CartContextValue = {
  slugs: string[];
  count: number;
  add: (product: Product) => void;
  remove: (slug: string) => void;
  has: (slug: string) => boolean;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "rad-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(saved))
        setSlugs(saved.filter((item) => typeof item === "string"));
    } catch {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(slugs));
    } catch {}
  }, [slugs]);

  const value = useMemo<CartContextValue>(
    () => ({
      slugs,
      count: slugs.length,
      add: (product) =>
        setSlugs((current) =>
          current.includes(product.slug) ? current : [...current, product.slug],
        ),
      remove: (slug) =>
        setSlugs((current) => current.filter((item) => item !== slug)),
      has: (slug) => slugs.includes(slug),
      clear: () => setSlugs([]),
    }),
    [slugs],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider");
  return cart;
}

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
