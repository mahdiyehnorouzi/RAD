import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@rad/types";

interface CartState {
  slugs: string[];
  add: (product: Product) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      slugs: [],
      add: (product) => {
        if (product.status === "sold") return;
        set(({ slugs }) => ({ slugs: slugs.includes(product.slug) ? slugs : [...slugs, product.slug] }));
      },
      remove: (slug) => set(({ slugs }) => ({ slugs: slugs.filter((item) => item !== slug) })),
      clear: () => set({ slugs: [] }),
      has: (slug) => get().slugs.includes(slug),
    }),
    { name: "rad-cart-v2" },
  ),
);
