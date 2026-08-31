"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/products";
import type { Locale } from "./i18n";
import { api } from "@/lib/api";

type CartContextValue = {
  slugs: string[];
  add: (product: Product) => Promise<void>;
  remove: (slug: string) => Promise<void>;
  clear: () => Promise<void>;
  has: (slug: string) => boolean;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    const load = () =>
      api<{ slugs: string[] }>("/cart")
        .then((payload) => setSlugs(payload.slugs))
        .catch(() => {});
    load();
    window.addEventListener("rad:session", load);
    return () => window.removeEventListener("rad:session", load);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      slugs,
      add: async (product) => {
        if (product.status === "sold" || product.status === "reserved") return;
        const payload = await api<{ slugs: string[] }>("/cart/items", {
          method: "POST",
          body: JSON.stringify({ slug: product.slug }),
        });
        setSlugs(payload.slugs);
      },
      remove: async (slug) => {
        const payload = await api<{ slugs: string[] }>(`/cart/items/${slug}`, {
          method: "DELETE",
        });
        setSlugs(payload.slugs);
      },
      clear: async () => {
        const payload = await api<{ slugs: string[] }>("/cart", { method: "DELETE" });
        setSlugs(payload.slugs);
      },
      has: (slug) => slugs.includes(slug),
      count: slugs.length,
    }),
    [slugs],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
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
