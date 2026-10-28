"use client";
import "./commerce-provider.css";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type {
  AuthUser,
  Notice,
  NoticeKind,
  Order,
  Review,
  SessionState,
} from "@rad/types";
import type { PaymentReceiptInput, PlaceOrderInput } from "@/types/api";
import { api } from "@/lib/api";
import { useCatalogRefresh } from "@/hooks/use-catalog-refresh";
import { useCatalogIndex } from "../../catalog/catalog-index-provider";
import { useLocale } from "@/components/i18n";
import { Heart, X } from "lucide-react";
import { logRecovered } from "@/lib/log";

type Toast = {
  id: number;
  kind: "favoriteAdded" | "favoriteRemoved" | "cartAdded" | "reviewAdded";
  productSlug?: string;
};

type CommerceContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  requestOtp: (phone: string) => Promise<{ expiresInSeconds: number }>;
  signInWithOtp: (input: { phone: string; code: string }) => Promise<void>;
  logout: () => Promise<void>;
  favorites: string[];
  toggleFavorite: (slug: string) => Promise<void>;
  isFavorite: (slug: string) => boolean;
  notices: Notice[];
  unread: number;
  addNotice: (kind: NoticeKind, productSlug?: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /** Empty until a page calls {@link useOrders}; single orders are upserted as they change. */
  orders: Order[];
  ordersReady: boolean;
  requestOrders: () => void;
  placeOrder: (order: PlaceOrderInput) => Promise<Order>;
  confirmDemoPayment: (
    id: string,
    receipt: PaymentReceiptInput,
  ) => Promise<Order>;
  /** Called once, after ZarinPal redirects back with Authority/Status. */
  verifyPayment: (
    id: string,
    input: { authority?: string; status?: string },
  ) => Promise<Order>;
  /** Starts a fresh gateway session for the same pending order. */
  retryPayment: (id: string) => Promise<Order>;
  cancelOrder: (id: string) => Promise<Order>;
  reviews: Review[];
  addReview: (review: Omit<Review, "id" | "createdAt">) => Promise<void>;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);

const NOTICE_POLL_MS = 30_000;
const FAVORITES_CACHE_KEY = "rad.favorites.cache";

function upsertOrder(orders: Order[], order: Order) {
  return orders.some((item) => item.id === order.id)
    ? orders.map((item) => (item.id === order.id ? order : item))
    : [order, ...orders];
}

/**
 * Seeds favorites from the last known server response so a hard refresh or
 * locale switch (a full `window.location.assign`, see `switchLocale`) never
 * paints an empty favorites list while `/session` is still in flight.
 */
function cachedFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v) => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function cacheFavorites(slugs: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAVORITES_CACHE_KEY, JSON.stringify(slugs));
  } catch {}
}

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersReady, setOrdersReady] = useState(false);
  const ordersWanted = useRef(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const { nameOf } = useCatalogIndex();
  const refresh = useCatalogRefresh();
  const { locale, t } = useLocale();

  // `payload.notices`/`session.notices` defensively fall back to `[]` — a
  // malformed/partial API response (seen locally with the dev proxy's
  // ERR_CONTENT_DECODING_FAILED) must not leave `notices` as `undefined`,
  // which crashes every render that calls `.filter` on it below.
  const applyNotices = (payload: { notices?: Notice[]; unread?: number }) => {
    setNotices(payload.notices ?? []);
  };

  const applySession = useCallback((session: SessionState) => {
    setUser(session.user);
    // Same defensive fallback as `notices` above, for the same reason: a
    // malformed/partial `/session` response must not leave `favorites`
    // `undefined`, which crashes every render that calls `.includes` on it
    // (e.g. `FavoriteButton` via this provider's `isFavorite`).
    const favorites = session.favorites ?? [];
    setFavorites(favorites);
    cacheFavorites(favorites);
    setNotices(session.notices ?? []);
  }, []);

  // Runs before paint so a refresh or locale switch (a full page reload,
  // see `switchLocale`) never flashes an empty favorites list while the
  // `/session` request above is still in flight.
  useLayoutEffect(() => {
    const cached = cachedFavorites();
    if (cached.length) setFavorites(cached);
  }, []);

  const loadOrders = useCallback(async () => {
    ordersWanted.current = true;
    try {
      setOrders(await api<Order[]>("/orders"));
    } catch (error) {
      logRecovered("orders", error);
      // Keep whatever is already shown; order pages fall back to fetching one order.
    } finally {
      setOrdersReady(true);
    }
  }, []);

  const requestOrders = useCallback(() => {
    if (!ordersWanted.current) void loadOrders();
  }, [loadOrders]);

  const syncSession = async () => {
    applySession(await api<SessionState>("/session"));
    if (ordersWanted.current) await loadOrders();
    else setOrders([]);
    window.dispatchEvent(new Event("rad:session"));
  };

  useEffect(() => {
    let cancelled = false;
    api<SessionState>("/session")
      .then((session) => {
        if (!cancelled) applySession(session);
      })
      .catch((error) => logRecovered("session", error))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  useEffect(() => {
    const refreshNotices = () => {
      if (document.visibilityState !== "visible") return;
      api<{ notices?: Notice[] }>("/notices")
        .then((payload) => setNotices(payload.notices ?? []))
        .catch((error) => logRecovered("notices", error));
    };
    const timer = window.setInterval(refreshNotices, NOTICE_POLL_MS);
    document.addEventListener("visibilitychange", refreshNotices);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshNotices);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const addNotice = async (kind: NoticeKind, productSlug?: string) => {
    const payload = await api<{ notices: Notice[] }>("/notices", {
      method: "POST",
      body: JSON.stringify({ kind, productSlug }),
    });
    applyNotices(payload);
    if (kind === "cart")
      setToast({ id: Date.now(), kind: "cartAdded", productSlug });
  };

  const value = useMemo<CommerceContextValue>(
    () => ({
      user,
      ready,
      login: async (input) => {
        await api<{ user: AuthUser }>("/auth/session", {
          method: "POST",
          body: JSON.stringify(input),
        });
        await syncSession();
      },
      register: async (input) => {
        await api<{ user: AuthUser }>("/auth/register", {
          method: "POST",
          body: JSON.stringify(input),
        });
        await syncSession();
      },
      requestOtp: (phone) =>
        api<{ message: string; expiresInSeconds: number }>(
          "/auth/otp/request",
          {
            method: "POST",
            body: JSON.stringify({ phone }),
          },
        ),
      signInWithOtp: async (input) => {
        await api<{ user: AuthUser }>("/auth/otp/signin", {
          method: "POST",
          body: JSON.stringify(input),
        });
        await syncSession();
      },
      logout: async () => {
        await api("/auth/logout", { method: "POST" });
        setUser(null);
        await syncSession();
      },
      favorites,
      toggleFavorite: async (slug) => {
        const payload = await api<{ slugs: string[]; added: boolean }>(
          `/favorites/${slug}`,
          { method: "POST" },
        );
        setFavorites(payload.slugs);
        cacheFavorites(payload.slugs);
        if (payload.added) {
          await addNotice("favorite", slug);
          setToast({
            id: Date.now(),
            kind: "favoriteAdded",
            productSlug: slug,
          });
        } else {
          setToast({
            id: Date.now(),
            kind: "favoriteRemoved",
            productSlug: slug,
          });
        }
      },
      isFavorite: (slug) => favorites.includes(slug),
      notices,
      unread: notices.filter((notice) => !notice.read).length,
      addNotice,
      markAllRead: async () => {
        applyNotices(
          await api<{ notices: Notice[] }>("/notices/read", { method: "POST" }),
        );
      },
      orders,
      ordersReady,
      requestOrders,
      placeOrder: async (order) => {
        const created = await api<Order>("/orders", {
          method: "POST",
          body: JSON.stringify(order),
        });
        setOrders((current) => upsertOrder(current, created));
        await refresh();
        window.dispatchEvent(new Event("rad:session"));
        return created;
      },
      // Every order-affecting action resyncs the cart the same way placeOrder
      // does, even though checkout already clears it before redirecting to
      // the gateway: relying on that ordering alone is fragile, and
      // cancelOrder/verifyPayment can still change what's purchasable.
      confirmDemoPayment: async (id, receipt) => {
        const updated = await api<Order>(`/orders/${id}/confirm-payment`, {
          method: "POST",
          body: JSON.stringify(receipt),
        });
        setOrders((current) => upsertOrder(current, updated));
        await refresh();
        window.dispatchEvent(new Event("rad:session"));
        return updated;
      },
      verifyPayment: async (id, input) => {
        const updated = await api<Order>(`/orders/${id}/payment/verify`, {
          method: "POST",
          body: JSON.stringify(input),
        });
        setOrders((current) => upsertOrder(current, updated));
        await refresh();
        window.dispatchEvent(new Event("rad:session"));
        return updated;
      },
      retryPayment: async (id) => {
        const updated = await api<Order>(`/orders/${id}/payment/retry`, {
          method: "POST",
        });
        setOrders((current) => upsertOrder(current, updated));
        await refresh();
        window.dispatchEvent(new Event("rad:session"));
        return updated;
      },
      cancelOrder: async (id) => {
        const updated = await api<Order>(`/orders/${id}/cancel`, {
          method: "POST",
        });
        setOrders((current) => upsertOrder(current, updated));
        await refresh();
        window.dispatchEvent(new Event("rad:session"));
        return updated;
      },
      reviews,
      addReview: async (review) => {
        const created = await api<Review>(
          `/products/${review.productSlug}/reviews`,
          {
            method: "POST",
            body: JSON.stringify({
              rating: review.rating,
              comment: review.comment,
              image: review.image,
            }),
          },
        );
        setReviews((current) => [created, ...current]);
        setToast({
          id: Date.now(),
          kind: "reviewAdded",
          productSlug: review.productSlug,
        });
      },
    }),
    [
      user,
      ready,
      favorites,
      notices,
      orders,
      ordersReady,
      requestOrders,
      reviews,
      refresh,
    ],
  );

  const toastName = nameOf(toast?.productSlug, locale);
  const toastText =
    toast?.kind === "favoriteAdded"
      ? `${t("toastFavoriteAdded")} ${toastName}`
      : toast?.kind === "favoriteRemoved"
        ? `${t("toastFavoriteRemoved")} ${toastName}`
        : toast?.kind === "cartAdded"
          ? `${t("toastCartAdded")} ${toastName}`
          : t("toastReviewAdded");
  return (
    <CommerceContext.Provider value={value}>
      {children}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <span>{toastText}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label={t("closeToast")}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      )}
    </CommerceContext.Provider>
  );
}

export function useCommerce() {
  const value = useContext(CommerceContext);
  if (!value)
    throw new Error("useCommerce must be used inside CommerceProvider");
  return value;
}

/** The visitor's order list, fetched the first time any page asks for it. */
export function useOrders() {
  const { orders, ordersReady, requestOrders } = useCommerce();
  useEffect(() => requestOrders(), [requestOrders]);
  return { orders, ready: ordersReady };
}

const FAVORITE_RAYS = [0, 1, 2, 3, 4, 5, 6, 7];

export function FavoriteButton({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  const { isFavorite, toggleFavorite } = useCommerce();
  const { t } = useLocale();
  const [pending, setPending] = useState<boolean | null>(null);
  const active = pending ?? isFavorite(slug);
  const [burst, setBurst] = useState(0);
  const bursting = active && burst > 0;
  return (
    <button
      type="button"
      className={`favorite-button ${compact ? "compact" : ""} ${active ? "active" : ""} ${bursting ? "is-bursting" : ""}`}
      onClick={() => {
        if (!active) setBurst((count) => count + 1);
        setPending(!active);
        toggleFavorite(slug).finally(() => setPending(null));
      }}
      aria-pressed={active}
      aria-label={active ? t("removeFavorite") : t("addFavorite")}
    >
      <Heart aria-hidden="true" fill={active ? "currentColor" : "none"} />
      {bursting ? (
        <span key={burst} className="favorite-burst" aria-hidden="true">
          {FAVORITE_RAYS.map((ray) => (
            <i key={ray} style={{ "--ray": ray } as CSSProperties} />
          ))}
        </span>
      ) : null}
      {!compact && <b>{active ? t("savedFavorite") : t("saveFavorite")}</b>}
    </button>
  );
}
