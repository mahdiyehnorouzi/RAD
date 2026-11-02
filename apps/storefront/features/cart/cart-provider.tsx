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
import { browserGuestId } from "@/lib/api/guest-id";
import { useCommerce } from "@/components/commerce";
import { useCatalogRefresh } from "@/hooks/use-catalog-refresh";
import {
  adoptVisitor,
  createCartQueue,
  readBagMemory,
  reconcileBagBaseline,
  runQueuedCartMutation,
  sessionOwnerFromEvent,
  shouldReloadBagOnPageShow,
  visitorOwner,
  writeBagMemory,
  type BagMemoryMode,
} from "./bag-sync";

type CartContextValue = {
  slugs: string[];
  /** Hold deadline per slug (epoch ms); unpaid works return to the shop after it. */
  holds: Record<string, number>;
  /** Price per slug when it entered the bag. */
  prices: Record<string, CartPriceAtAdd>;
  /** Earliest hold deadline in the bag, if any. */
  holdEndsAt: number | null;
  /** Unpaid orders that already received works from this bag. */
  pendingOrders: CartSnapshot["pendingOrders"];
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
const emptyCart: CartSnapshot = {
  slugs: [],
  holds: {},
  prices: {},
  pendingOrders: [],
};

function snapshotOf(payload: CartSnapshot): CartSnapshot {
  return {
    slugs: payload.slugs,
    holds: payload.holds ?? {},
    prices: payload.prices ?? {},
    pendingOrders: payload.pendingOrders ?? [],
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const refreshCatalog = useCatalogRefresh();
  const { user, ready: sessionReady } = useCommerce();
  const [cart, setCart] = useState<CartSnapshot>(emptyCart);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [released, setReleased] = useState<string[]>([]);
  const ownerRef = useRef<string | null>(null);
  const ownerEpoch = useRef(0);
  const resetBaseline = useRef(false);
  const pendingSnapshot = useRef<CartSnapshot | null>(null);
  const enqueue = useRef(createCartQueue()).current;

  const commitBag = useCallback(
    (payload: CartSnapshot, mode: BagMemoryMode) => {
      const next = snapshotOf(payload);
      setCart(next);
      const owner = ownerRef.current;
      if (!owner) {
        pendingSnapshot.current = payload;
        return;
      }
      pendingSnapshot.current = null;
      const resolved = resetBaseline.current ? "reset" : mode;
      resetBaseline.current = false;
      try {
        const memory = reconcileBagBaseline(
          readBagMemory(window.localStorage),
          owner,
          next.slugs,
          next.pendingOrders ?? [],
          resolved,
        );
        writeBagMemory(window.localStorage, memory);
        setReleased(memory.released);
      } catch {
        /* private mode */
      }
    },
    [],
  );

  const load = useCallback(() => {
    const epoch = ownerEpoch.current;
    return enqueue(() =>
      api<CartSnapshot>("/cart")
        .then((payload) => {
          if (epoch !== ownerEpoch.current) return;
          commitBag(payload, "detect");
          setLoaded(true);
          setLoadError(false);
        })
        .catch((err) => {
          console.error("Failed to load cart", err);
          setLoadError(true);
        })
        .finally(() => setReady(true)),
    );
  }, [commitBag, enqueue]);

  useEffect(() => {
    if (!sessionReady) return;
    const nextOwner = visitorOwner(user?.id, browserGuestId());
    const adopted = adoptVisitor(
      {
        owner: ownerRef.current,
        epoch: ownerEpoch.current,
        resetBaseline: resetBaseline.current,
      },
      nextOwner,
    );
    ownerRef.current = adopted.clock.owner;
    ownerEpoch.current = adopted.clock.epoch;
    resetBaseline.current = adopted.clock.resetBaseline;
    if (adopted.reload) {
      pendingSnapshot.current = null;
      setReleased([]);
      void load();
    }
    const pending = pendingSnapshot.current;
    if (pending && nextOwner) commitBag(pending, "detect");
  }, [sessionReady, user?.id, commitBag, load]);

  useEffect(() => {
    void load();
    const onSession = (event: Event) => {
      const owner = sessionOwnerFromEvent(
        event instanceof CustomEvent ? event.detail : undefined,
        browserGuestId(),
      );
      if (owner.known) {
        // The previous visitor's baseline must not explain this bag.
        ownerEpoch.current += 1;
        ownerRef.current = owner.owner;
        resetBaseline.current = true;
        pendingSnapshot.current = null;
        setReleased([]);
      }
      void load();
    };
    const onOnline = () => void load();
    const onShow = () => {
      // `pageshow` covers a Safari bfcache restore, which does not remount React.
      if (!shouldReloadBagOnPageShow()) return;
      void load().then(() => refreshCatalog());
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void load().then(() => refreshCatalog());
      }
    };
    window.addEventListener("rad:session", onSession);
    window.addEventListener("online", onOnline);
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("rad:session", onSession);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, refreshCatalog]);

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
      pendingOrders: cart.pendingOrders ?? [],
      released,
      dismissReleased: () => {
        setReleased([]);
        const owner = ownerRef.current;
        if (!owner) return;
        try {
          const memory = readBagMemory(window.localStorage);
          if (!memory || memory.owner !== owner) return;
          writeBagMemory(window.localStorage, { ...memory, released: [] });
        } catch {
          /* private mode */
        }
      },
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
        // (e.g. a 5xx from the API).
        const applied = await runQueuedCartMutation(
          enqueue,
          ownerEpoch.current,
          () => ownerEpoch.current,
          () =>
            api<CartSnapshot>("/cart/items", {
              method: "POST",
              body: JSON.stringify({ slug }),
            }),
          (payload) => commitBag(payload, "keep"),
        );
        if (!applied) return false;
        void refreshCatalog();
        return true;
      },
      remove: async (slug) => {
        const applied = await runQueuedCartMutation(
          enqueue,
          ownerEpoch.current,
          () => ownerEpoch.current,
          () => api<CartSnapshot>(`/cart/items/${slug}`, { method: "DELETE" }),
          (payload) => commitBag(payload, "keep"),
        );
        if (applied) void refreshCatalog();
      },
      clear: async () => {
        const applied = await runQueuedCartMutation(
          enqueue,
          ownerEpoch.current,
          () => ownerEpoch.current,
          () => api<CartSnapshot>("/cart", { method: "DELETE" }),
          (payload) => commitBag(payload, "keep"),
        );
        if (applied) void refreshCatalog();
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
      commitBag,
      enqueue,
      refreshCatalog,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
