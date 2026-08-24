"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { productCopy, products } from "@/lib/products";
import { useLocale } from "./i18n";
import { Bell, Heart, UserRound, X } from "lucide-react";

type User = { name: string; email: string };
type NoticeKind = "favorite" | "cart" | "welcome" | "order";
type Notice = {
  id: string;
  kind: NoticeKind;
  productSlug?: string;
  read: boolean;
  createdAt: number;
};
export type Order = {
  id: string;
  slugs: string[];
  total: number;
  usdTotal?: number;
  createdAt: number;
  status: "received";
  delivery: { name: string; city: string };
};
export type Review = {
  id: string;
  productSlug: string;
  author: string;
  rating: number;
  comment: string;
  image?: string;
  createdAt: number;
};
type Toast = {
  id: number;
  kind: "favoriteAdded" | "favoriteRemoved" | "cartAdded" | "reviewAdded";
  productSlug?: string;
};

type CommerceContextValue = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  favorites: string[];
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  notices: Notice[];
  unread: number;
  addNotice: (kind: NoticeKind, productSlug?: string) => void;
  markAllRead: () => void;
  orders: Order[];
  placeOrder: (order: Omit<Order, "id" | "createdAt" | "status">) => void;
  reviews: Review[];
  addReview: (review: Omit<Review, "id" | "createdAt">) => void;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);
const userKey = "rad-user-v1";
const favoriteKey = "rad-favorites-v1";
const noticeKey = "rad-notices-v1";
const orderKey = "rad-orders-v1";
const reviewKey = "rad-reviews-v1";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const { locale, t } = useLocale();

  useEffect(() => {
    setUser(readStorage<User | null>(userKey, null));
    setFavorites(
      readStorage<string[]>(favoriteKey, []).filter((slug) =>
        products.some((p) => p.slug === slug),
      ),
    );
    setNotices(readStorage<Notice[]>(noticeKey, []).slice(0, 20));
    setOrders(readStorage<Order[]>(orderKey, []));
    setReviews(readStorage<Review[]>(reviewKey, []));
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) writeStorage(userKey, user);
  }, [ready, user]);
  useEffect(() => {
    if (ready) writeStorage(favoriteKey, favorites);
  }, [ready, favorites]);
  useEffect(() => {
    if (ready) writeStorage(noticeKey, notices);
  }, [ready, notices]);
  useEffect(() => {
    if (ready) writeStorage(orderKey, orders);
  }, [ready, orders]);
  useEffect(() => {
    if (ready) writeStorage(reviewKey, reviews);
  }, [ready, reviews]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const addNotice = (kind: NoticeKind, productSlug?: string) => {
    setNotices((current) =>
      [
        {
          id: `${Date.now()}-${Math.random()}`,
          kind,
          productSlug,
          read: false,
          createdAt: Date.now(),
        },
        ...current,
      ].slice(0, 20),
    );
    if (kind === "cart")
      setToast({ id: Date.now(), kind: "cartAdded", productSlug });
  };

  const value = useMemo<CommerceContextValue>(
    () => ({
      user,
      login: (next) => {
        setUser(next);
        addNotice("welcome");
      },
      logout: () => setUser(null),
      favorites,
      toggleFavorite: (slug) =>
        setFavorites((current) => {
          if (current.includes(slug)) {
            setToast({
              id: Date.now(),
              kind: "favoriteRemoved",
              productSlug: slug,
            });
            return current.filter((item) => item !== slug);
          }
          addNotice("favorite", slug);
          setToast({
            id: Date.now(),
            kind: "favoriteAdded",
            productSlug: slug,
          });
          return [...current, slug];
        }),
      isFavorite: (slug) => favorites.includes(slug),
      notices,
      unread: notices.filter((notice) => !notice.read).length,
      addNotice,
      markAllRead: () =>
        setNotices((current) =>
          current.map((notice) => ({ ...notice, read: true })),
        ),
      orders,
      placeOrder: (order) =>
        setOrders((current) => [
          {
            ...order,
            id: `RAD-${Date.now().toString().slice(-6)}`,
            createdAt: Date.now(),
            status: "received",
          },
          ...current,
        ]),
      reviews,
      addReview: (review) => {
        setReviews((current) => [
          { ...review, id: `review-${Date.now()}`, createdAt: Date.now() },
          ...current,
        ]);
        setToast({
          id: Date.now(),
          kind: "reviewAdded",
          productSlug: review.productSlug,
        });
      },
    }),
    [user, favorites, notices, orders, reviews],
  );

  const toastProduct = products.find(
    (product) => product.slug === toast?.productSlug,
  );
  const toastName = toastProduct ? productCopy(toastProduct, locale).name : "";
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

export function FavoriteButton({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  const { isFavorite, toggleFavorite } = useCommerce();
  const { t } = useLocale();
  const active = isFavorite(slug);
  return (
    <button
      type="button"
      className={`favorite-button ${compact ? "compact" : ""} ${active ? "active" : ""}`}
      onClick={() => toggleFavorite(slug)}
      aria-pressed={active}
      aria-label={active ? t("removeFavorite") : t("addFavorite")}
    >
      <Heart aria-hidden="true" fill={active ? "currentColor" : "none"} />
      {!compact && <b>{active ? t("savedFavorite") : t("saveFavorite")}</b>}
    </button>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { notices, unread, markAllRead } = useCommerce();
  const { locale, t, number } = useLocale();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const close = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== "notifications")
        setOpen(false);
    };
    window.addEventListener("keydown", escape);
    window.addEventListener("rad:header-overlay", close);
    return () => {
      window.removeEventListener("keydown", escape);
      window.removeEventListener("rad:header-overlay", close);
    };
  }, []);
  const noticeText = (notice: Notice) => {
    const product = products.find((item) => item.slug === notice.productSlug);
    const name = product ? productCopy(product, locale).name : "";
    if (notice.kind === "favorite") return `${t("noticeFavorite")} ${name}`;
    if (notice.kind === "cart") return `${t("noticeCart")} ${name}`;
    if (notice.kind === "order") return t("noticeOrder");
    return t("noticeWelcome");
  };
  return (
    <div className="notification-center">
      <button
        className="utility-button"
        type="button"
        onClick={() =>
          setOpen((value) => {
            const next = !value;
            if (next)
              window.dispatchEvent(
                new CustomEvent("rad:header-overlay", {
                  detail: "notifications",
                }),
              );
            return next;
          })
        }
        aria-expanded={open}
        aria-controls="notification-panel"
        aria-label={t("notifications")}
      >
        <Bell aria-hidden="true" />
        {unread > 0 && <i>{number(unread)}</i>}
      </button>
      {open && (
        <aside id="notification-panel" className="notification-panel">
          <header>
            <div>
              <span className="eyebrow">{t("notificationCenter")}</span>
              <h2>{t("notifications")}</h2>
            </div>
            {unread > 0 && (
              <button className="text-button" onClick={markAllRead}>
                {t("markAllRead")}
              </button>
            )}
          </header>
          {notices.length ? (
            <ul>
              {notices.map((notice) => (
                <li key={notice.id} className={notice.read ? "" : "unread"}>
                  <span>{noticeText(notice)}</span>
                  <small>
                    {new Intl.DateTimeFormat(
                      locale === "fa" ? "fa-IR" : "en-US",
                      { hour: "2-digit", minute: "2-digit" },
                    ).format(notice.createdAt)}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="notice-empty">{t("noNotifications")}</p>
          )}
        </aside>
      )}
    </div>
  );
}

export function AccountLink() {
  const { user } = useCommerce();
  const { t, href } = useLocale();
  return (
    <Link
      className="utility-button account-link"
      href={href("/account")}
      aria-label={user ? t("profile") : t("login")}
    >
      <UserRound aria-hidden="true" />
    </Link>
  );
}
