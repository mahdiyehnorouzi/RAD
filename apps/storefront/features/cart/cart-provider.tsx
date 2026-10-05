"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartPriceAtAdd, CartSnapshot, Product } from "@rad/types";
import { isPurchasableStatus } from "@rad/types";
import { api } from "@/lib/api";
import { useCatalogRefresh } from "@/hooks/use-catalog-refresh";

type CartContextValue = {
  slugs: string[];
  /** Hold deadline per slug (epoch ms); unpaid works return to the shop after it. */
  holds: Record<string, number>;
  /** Price per slug when it entered the bag. */
  prices: Record<string, CartPriceAtAdd>;
  /** Earliest hold deadline in the bag, if any. */
  holdEndsAt: number | null;
  /** Works that left the bag without the visitor removing them (hold ran out). */
  released: string[];
  dismissReleased: () => void;
  /** First load has settled, successfully or not. */
  ready: boolean;
  /** At least one snapshot has arrived from the API. */
  loaded: boolean;
  /** The last attempt to read the bag failed. */
  loadError: boolean;
  reload: () => Promise<void>;
  add: (product: Product) => Promise<boolean>;
  remove: (slug: string) => Promise<void>;
  clear: () => Promise<void>;
  has: (slug: string) => boolean;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const emptyCart: CartSnapshot = { slugs: [], holds: {}, prices: {} };
const knownKey = "rad-cart-known";
const releasedKey = "rad-cart-released";

function readList(key: string): string[] | null {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(key) ?? "null",
    ) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : null;
  } catch {
    return null;
  }
}

function writeList(key: string, value: string[] | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or quota */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const refreshCatalog = useCatalogRefresh();
  const [cart, setCart] = useState<CartSnapshot>(emptyCart);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [released, setReleased] = useState<string[]>([]);
  /** Slugs in the last snapshot this browser saw; `null` = no baseline yet. */
  const known = useRef<string[] | null>(null);

  useEffect(() => {
    known.current = readList(knownKey);
    setReleased(readList(releasedKey) ?? []);
  }, []);

  const updateReleased = useCallback((map: (current: string[]) => string[]) => {
    setReleased((current) => {
      const next = map(current);
      writeList(releasedKey, next);
      return next;
    });
  }, []);

  const apply = useCallback(
    (payload: CartSnapshot, detectReleased = false) => {
      const slugs = payload.slugs;
      if (detectReleased && known.current) {
        const gone = known.current.filter((slug) => !slugs.includes(slug));
        if (gone.length) {
          updateReleased((current) => [...new Set([...current, ...gone])]);
        }
      }
      known.current = slugs;
      writeList(knownKey, slugs);
      updateReleased((current) => {
        const next = current.filter((slug) => !slugs.includes(slug));
        return next.length === current.length ? current : next;
      });
      setCart({
        slugs,
        holds: payload.holds ?? {},
        prices: payload.prices ?? {},
      });
    },
    [updateReleased],
  );

  const load = useCallback(
    () =>
      api<CartSnapshot>("/cart")
        .then((payload) => {
          apply(payload, true);
          setLoaded(true);
          setLoadError(false);
        })
        .catch((err) => {
          console.error("Failed to load cart", err);
          setLoadError(true);
        })
        .finally(() => setReady(true)),
    [apply],
  );

  useEffect(() => {
    void load();
    const onSession = () => {
      // A different owner's bag: nothing was "released", the baseline just changed.
      known.current = null;
      writeList(knownKey, null);
      updateReleased(() => []);
      void load();
    };
    const onOnline = () => void load();
    window.addEventListener("rad:session", onSession);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("rad:session", onSession);
      window.removeEventListener("online", onOnline);
    };
  }, [load, updateReleased]);

  const holdEndsAt = useMemo(() => {
    const deadlines = Object.values(cart.holds);
    return deadlines.length ? Math.min(...deadlines) : null;
  }, [cart.holds]);

  useEffect(() => {
    if (!holdEndsAt) return undefined;
    const timer = window.setTimeout(
      () => {
        void load().then(() => refreshCatalog());
      },
      Math.max(0, holdEndsAt - Date.now()) + 1000,
    );
    return () => window.clearTimeout(timer);
  }, [holdEndsAt, load, refreshCatalog]);

  const value = useMemo<CartContextValue>(
    () => ({
      slugs: cart.slugs,
      holds: cart.holds,
      prices: cart.prices ?? {},
      holdEndsAt,
      released,
      dismissReleased: () => updateReleased(() => []),
      ready,
      loaded,
      loadError,
      reload: load,
      add: async (product) => {
        if (!isPurchasableStatus(product.status)) return false;
        const slug = product.slug;
        // No optimistic flip here: `has(slug)`/`count` must only ever reflect
        // a confirmed server snapshot, so the UI can never read "added"
        // while the request is still in flight or has actually failed
        // (e.g. a 5xx from the API) — only `apply()` on real success moves
        // the needle.
        apply(
          await api<CartSnapshot>("/cart/items", {
            method: "POST",
            body: JSON.stringify({ slug }),
          }),
        );
        void refreshCatalog();
        return true;
      },
      remove: async (slug) => {
        apply(
          await api<CartSnapshot>(`/cart/items/${slug}`, { method: "DELETE" }),
        );
        void refreshCatalog();
      },
      clear: async () => {
        apply(await api<CartSnapshot>("/cart", { method: "DELETE" }));
        void refreshCatalog();
      },
      has: (slug) => cart.slugs.includes(slug),
      count: cart.slugs.length,
    }),
    [
      cart,
      holdEndsAt,
      released,
      ready,
      loaded,
      loadError,
      load,
      apply,
      refreshCatalog,
      updateReleased,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
