"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Product } from "@rad/types";
import { api, ApiError } from "@/lib/api";

type CartContextValue = {
  slugs: string[];
  add: (product: Product) => Promise<boolean>;
  remove: (slug: string) => Promise<void>;
  clear: () => Promise<void>;
  has: (slug: string) => boolean;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const load = () =>
      api<{ slugs: string[] }>("/cart")
        .then((payload) => {
          if (mounted.current) setSlugs(payload.slugs);
        })
        .catch(() => {});
    load();
    window.addEventListener("rad:session", load);
    return () => {
      mounted.current = false;
      window.removeEventListener("rad:session", load);
    };
  }, []);

  const add = useCallback(async (product: Product) => {
    if (product.status === "sold" || product.status === "reserved") return false;
    try {
      const payload = await api<{ slugs: string[] }>("/cart/items", {
        method: "POST",
        body: JSON.stringify({ slug: product.slug }),
      });
      if (mounted.current) setSlugs(payload.slugs);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) return false;
      throw error;
    }
  }, []);

  const remove = useCallback(async (slug: string) => {
    const payload = await api<{ slugs: string[] }>(`/cart/items/${slug}`, {
      method: "DELETE",
    });
    if (mounted.current) setSlugs(payload.slugs);
  }, []);

  const clear = useCallback(async () => {
    const payload = await api<{ slugs: string[] }>("/cart", { method: "DELETE" });
    if (mounted.current) setSlugs(payload.slugs);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      slugs,
      add,
      remove,
      clear,
      has: (slug) => slugs.includes(slug),
      count: slugs.length,
    }),
    [slugs, add, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
