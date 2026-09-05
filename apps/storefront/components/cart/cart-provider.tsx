"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@rad/types";
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
