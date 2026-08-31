"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser, Notice, NoticeKind, Order, Review } from "@rad/types";
import { productCopy } from "@/lib/products";
import { api } from "@/lib/api";
import { useCatalog } from "./catalog-provider";
import { useLocale } from "./i18n";
import { Bell, Heart, UserRound, X } from "lucide-react";

type Toast = {
  id: number;
  kind: "favoriteAdded" | "favoriteRemoved" | "cartAdded" | "reviewAdded";
  productSlug?: string;
};

type CommerceContextValue = {
  user: AuthUser | null;
  login: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  favorites: string[];
  toggleFavorite: (slug: string) => Promise<void>;
  isFavorite: (slug: string) => boolean;
  notices: Notice[];
  unread: number;
  addNotice: (kind: NoticeKind, productSlug?: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  orders: Order[];
  placeOrder: (order: {
    name?: string;
    city?: string;
    phone?: string;
    address?: string;
  }) => Promise<Order>;
  reviews: Review[];
  addReview: (review: Omit<Review, "id" | "createdAt">) => Promise<void>;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const { getProduct, refresh } = useCatalog();
  const { locale, t } = useLocale();

  const applyNotices = (payload: { notices: Notice[]; unread?: number }) => {
    setNotices(payload.notices);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<{ user: AuthUser | null }>("/auth/me"),
      api<{ slugs: string[] }>("/favorites"),
      api<{ notices: Notice[] }>("/notices"),
      api<Order[]>("/orders"),
    ])
      .then(([session, favoritePayload, noticePayload, orderPayload]) => {
        if (cancelled) return;
        setUser(session.user);
        setFavorites(favoritePayload.slugs);
        setNotices(noticePayload.notices);
        setOrders(orderPayload);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
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
    if (kind === "cart") setToast({ id: Date.now(), kind: "cartAdded", productSlug });
  };

  const value = useMemo<CommerceContextValue>(
    () => ({
      user,
      login: async (input) => {
        const payload = await api<{ user: AuthUser }>("/auth/session", {
          method: "POST",
          body: JSON.stringify(input),
        });
        setUser(payload.user);
        const [favoritePayload, noticePayload, orderPayload] = await Promise.all([
          api<{ slugs: string[] }>("/favorites"),
          api<{ notices: Notice[] }>("/notices"),
          api<Order[]>("/orders"),
        ]);
        setFavorites(favoritePayload.slugs);
        setNotices(noticePayload.notices);
        setOrders(orderPayload);
        window.dispatchEvent(new Event("rad:session"));
      },
      logout: async () => {
        await api("/auth/logout", { method: "POST" });
        setUser(null);
        const [favoritePayload, noticePayload, orderPayload] = await Promise.all([
          api<{ slugs: string[] }>("/favorites"),
          api<{ notices: Notice[] }>("/notices"),
          api<Order[]>("/orders"),
        ]);
        setFavorites(favoritePayload.slugs);
        setNotices(noticePayload.notices);
        setOrders(orderPayload);
        window.dispatchEvent(new Event("rad:session"));
      },
      favorites,
      toggleFavorite: async (slug) => {
        const payload = await api<{ slugs: string[]; added: boolean }>(
          `/favorites/${slug}`,
          { method: "POST" },
        );
        setFavorites(payload.slugs);
        if (payload.added) {
          await addNotice("favorite", slug);
          setToast({ id: Date.now(), kind: "favoriteAdded", productSlug: slug });
        } else {
          setToast({ id: Date.now(), kind: "favoriteRemoved", productSlug: slug });
        }
      },
      isFavorite: (slug) => favorites.includes(slug),
      notices,
      unread: notices.filter((notice) => !notice.read).length,
      addNotice,
      markAllRead: async () => {
        applyNotices(await api<{ notices: Notice[] }>("/notices/read", { method: "POST" }));
      },
      orders,
      placeOrder: async (order) => {
        const created = await api<Order>("/orders", {
          method: "POST",
          body: JSON.stringify(order),
        });
        setOrders((current) => [created, ...current]);
        await refresh();
        window.dispatchEvent(new Event("rad:session"));
        return created;
      },
      reviews,
      addReview: async (review) => {
        const created = await api<Review>(`/products/${review.productSlug}/reviews`, {
          method: "POST",
          body: JSON.stringify({
            rating: review.rating,
            comment: review.comment,
            image: review.image,
          }),
        });
        setReviews((current) => [created, ...current]);
        setToast({ id: Date.now(), kind: "reviewAdded", productSlug: review.productSlug });
      },
    }),
    [user, favorites, notices, orders, reviews, refresh],
  );

  const toastProduct = getProduct(toast?.productSlug ?? "");
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
  const { getProduct } = useCatalog();
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
    const product = getProduct(notice.productSlug ?? "");
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
