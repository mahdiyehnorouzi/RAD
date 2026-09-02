"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser, Notice, NoticeKind, Order, Review } from "@rad/types";
import { api } from "@/lib/api";
import { useCatalog } from "@/components/catalog-provider";
import { CommerceToast, type Toast } from "@/components/commerce/commerce-toast";

type CommerceContextValue = {
  user: AuthUser | null;
  login: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
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
  const { refresh } = useCatalog();

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

  const addNotice = async (kind: NoticeKind, productSlug?: string) => {
    const payload = await api<{ notices: Notice[] }>("/notices", {
      method: "POST",
      body: JSON.stringify({ kind, productSlug }),
    });
    setNotices(payload.notices);
    if (kind === "cart")
      setToast({ id: Date.now(), kind: "cartAdded", productSlug });
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
        const [favoritePayload, noticePayload, orderPayload] =
          await Promise.all([
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
        const [favoritePayload, noticePayload, orderPayload] =
          await Promise.all([
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
        const payload = await api<{ notices: Notice[] }>("/notices/read", {
          method: "POST",
        });
        setNotices(payload.notices);
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
    [user, favorites, notices, orders, reviews, refresh],
  );

  return (
    <CommerceContext.Provider value={value}>
      {children}
      <CommerceToast toast={toast} onClose={() => setToast(null)} />
    </CommerceContext.Provider>
  );
}

export function useCommerce() {
  const value = useContext(CommerceContext);
  if (!value)
    throw new Error("useCommerce must be used inside CommerceProvider");
  return value;
}
