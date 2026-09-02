"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {AuthUser, Notice, NoticeKind, Order, Review} from "@rad/types";
import { createSession, fetchSession, logoutSession } from "@/lib/api/auth";
import { fetchFavorites, toggleFavorite as persistFavorite } from "@/lib/api/favorites";
import { createNotice, fetchNotices, markNoticesRead } from "@/lib/api/notices";
import { createOrder, fetchOrders } from "@/lib/api/orders";
import { createProductReview } from "@/lib/api/reviews";
import { useCatalog } from "@/components/catalog/catalog-provider";
import type { Toast } from "../type";
import { CommerceToast } from "./commerce-toast";

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
      fetchSession(),
      fetchFavorites(),
      fetchNotices(),
      fetchOrders(),
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
    const payload = await createNotice(kind, productSlug);
    setNotices(payload.notices);
    if (kind === "cart")
      setToast({ id: Date.now(), kind: "cartAdded", productSlug });
  };

  const value = useMemo<CommerceContextValue>(
    () => ({
      user,
      login: async (input) => {
        const payload = await createSession(input);
        setUser(payload.user);
        const [favoritePayload, noticePayload, orderPayload] =
          await Promise.all([
            fetchFavorites(),
            fetchNotices(),
            fetchOrders(),
          ]);
        setFavorites(favoritePayload.slugs);
        setNotices(noticePayload.notices);
        setOrders(orderPayload);
        window.dispatchEvent(new Event("rad:session"));
      },
      logout: async () => {
        await logoutSession();
        setUser(null);
        const [favoritePayload, noticePayload, orderPayload] =
          await Promise.all([
            fetchFavorites(),
            fetchNotices(),
            fetchOrders(),
          ]);
        setFavorites(favoritePayload.slugs);
        setNotices(noticePayload.notices);
        setOrders(orderPayload);
        window.dispatchEvent(new Event("rad:session"));
      },
      favorites,
      toggleFavorite: async (slug) => {
        const payload = await persistFavorite(slug);
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
        const payload = await markNoticesRead();
        setNotices(payload.notices);
      },
      orders,
      placeOrder: async (order) => {
        const created = await createOrder(order);
        setOrders((current) => [created, ...current]);
        await refresh();
        window.dispatchEvent(new Event("rad:session"));
        return created;
      },
      reviews,
      addReview: async (review) => {
        const created = await createProductReview(review.productSlug, {
          rating: review.rating,
          comment: review.comment,
          image: review.image,
        });
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
