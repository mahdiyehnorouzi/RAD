import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@rad/types";

interface CartState {
  slugs: string[];
  add: (product: Product) => boolean;
  remove: (slug: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      slugs: [],
      add: (product) => {
        if (product.status === "sold") return false;
        const { slugs } = get();
        if (slugs.includes(product.slug)) return false;
        set({ slugs: [...slugs, product.slug] });
        return true;
      },
      remove: (slug) => set(({ slugs }) => ({ slugs: slugs.filter((item) => item !== slug) })),
      clear: () => set({ slugs: [] }),
    }),
    { name: "rad-cart-v2" },
  ),
);
