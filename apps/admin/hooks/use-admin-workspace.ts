"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthUser } from "@rad/types";
import { api } from "../lib/api";
import {
  permissions,
  type AdminCommission,
  type AdminContactMessage,
  type AdminDamageReport,
  type AdminMember,
  type AdminOrder,
  type AdminPermission,
  type AdminProduct,
  type AdminReview,
  type AdminRole,
  type AdminSection,
  type AdminUser,
  type HelpQuestion,
  type HelpQuestionInput,
  type ShapeQuestion,
  type ShapeQuestionInput,
} from "../lib/admin-data";

/**
 * `initializing`: the one-time `/auth/me` session restore hasn't settled yet
 * — never treat this as logged out (no login-page flash, no redirect).
 * `authenticated` / `unauthenticated`: the restore resolved cleanly (a real
 * `{user: AuthUser | null}` response, not a thrown error).
 * `error`: the restore request itself failed (network/5xx/timeout) — this is
 * NOT the same as "no session". A valid session must never be dropped just
 * because one HTTP call hiccuped, so this state keeps whatever `user` was
 * already known and lets the caller retry instead of silently logging out.
 */
type AuthStatus =
  "initializing" | "authenticated" | "unauthenticated" | "error";

type ResourceKey =
  | "products"
  | "orders"
  | "members"
  | "users"
  | "commissions"
  | "messages"
  | "damageReports"
  | "reviews"
  | "shapeQuestions"
  | "helpQuestions";

/**
 * Which resources a section actually renders. Keeps the old "fetch
 * everything" behavior from happening on every mount — only the active
 * section's own data (plus whatever it cross-references, e.g. order status
 * panels needing the order's own messages/damage reports) is requested.
 */
const sectionResources: Record<AdminSection, ResourceKey[]> = {
  overview: ["products", "orders", "commissions"],
  products: ["products"],
  orders: ["orders", "messages", "damageReports"],
  messages: ["messages", "orders"],
  damage: ["damageReports", "orders"],
  commissions: ["commissions"],
  reviews: ["reviews"],
  shape: ["shapeQuestions"],
  help: ["helpQuestions"],
  users: ["users"],
  members: ["members"],
  account: [],
};

export function useAdminWorkspace() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("initializing");
  const [error, setError] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [commissions, setCommissions] = useState<AdminCommission[]>([]);
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [damageReports, setDamageReports] = useState<AdminDamageReport[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [shapeQuestions, setShapeQuestions] = useState<ShapeQuestion[]>([]);
  const [helpQuestions, setHelpQuestions] = useState<HelpQuestion[]>([]);
  const currentRole: AdminRole =
    (user?.adminRole as AdminRole | undefined) ?? "viewer";

  // Tracks which resources are loaded or in flight, so switching sections
  // back and forth — or React 18 dev-mode's double effect invocation —
  // never issues duplicate requests for data already fetched/loading.
  const loadedRef = useRef<Set<ResourceKey>>(new Set());
  const inFlightRef = useRef<Map<ResourceKey, Promise<unknown>>>(new Map());
  // Reactive mirror of `loadedRef`, so components can tell "hasn't loaded
  // yet" (show a skeleton) apart from "loaded and genuinely zero" (show
  // 0) — the array state alone can't distinguish those, since an empty
  // array looks the same either way.
  const [loadedKeys, setLoadedKeys] = useState<Set<ResourceKey>>(new Set());

  // The actual fetch-and-set for one resource, with no loaded/in-flight
  // guard — `fetchResource` below wraps this for the normal "load once per
  // section visit" path; `pollResource` (further down) calls it directly on
  // an interval so an already-loaded resource (messages, for the unread
  // badge and inbox) still picks up rows written by someone else's request
  // — there is no WebSocket/SSE layer in this app to invalidate on instead.
  const refreshResource = useCallback(async (key: ResourceKey) => {
    switch (key) {
      case "products":
        setProducts(await api<AdminProduct[]>("/admin/products"));
        break;
      case "orders":
        setOrders(await api<AdminOrder[]>("/admin/orders"));
        break;
      case "members":
        setMembers(await api<AdminMember[]>("/admin/members"));
        break;
      case "users":
        setUsers(await api<AdminUser[]>("/admin/users"));
        break;
      case "commissions":
        setCommissions(await api<AdminCommission[]>("/admin/commissions"));
        break;
      case "messages":
        setMessages(await api<AdminContactMessage[]>("/admin/messages"));
        break;
      case "damageReports":
          setDamageReports(
            await api<AdminDamageReport[]>("/admin/damage-reports"),
          );
          break;
        case "reviews":
          setReviews(await api<AdminReview[]>("/admin/reviews"));
          break;
        case "shapeQuestions":
          setShapeQuestions(
            await api<ShapeQuestion[]>("/admin/shape-questions"),
          );
          break;
      case "helpQuestions":
        setHelpQuestions(await api<HelpQuestion[]>("/admin/help-questions"));
        break;
    }
  }, []);

  const fetchResource = useCallback(
    (key: ResourceKey): Promise<unknown> => {
      if (loadedRef.current.has(key)) return Promise.resolve();
      const existing = inFlightRef.current.get(key);
      if (existing) return existing;
      const run = async () => {
        await refreshResource(key);
        loadedRef.current.add(key);
        setLoadedKeys((current) => new Set(current).add(key));
      };
      const promise = run().finally(() => inFlightRef.current.delete(key));
      inFlightRef.current.set(key, promise);
      return promise;
    },
    [refreshResource],
  );

  // Polls the inbox so a reply the customer sends while an admin already
  // has this tab open still shows up — there is no WebSocket/SSE channel
  // in this app to push it instead. Only runs once messages have been
  // loaded at least once (the global-badge effect below triggers that),
  // and only while authenticated.
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const timer = window.setInterval(() => {
      if (loadedRef.current.has("messages")) void refreshResource("messages");
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [authStatus, refreshResource]);

  const loadSection = useCallback(
    (section: AdminSection) =>
      Promise.all(sectionResources[section].map(fetchResource)),
    [fetchResource],
  );

  // Session restore — isolated from resource fetching on purpose (see
  // AuthStatus doc comment above): a flaky products/orders/etc. endpoint
  // must never be able to log out an otherwise-valid session.
  const restoreSession = useCallback(async () => {
    try {
      const { user: nextUser } = await api<{ user: AuthUser | null }>(
        "/auth/me",
      );
      setUser(nextUser);
      setAuthStatus(nextUser?.adminRole ? "authenticated" : "unauthenticated");
      return nextUser;
    } catch {
      // The request itself failed (network/5xx/timeout) — this is not proof
      // the session is invalid, so `user` is left untouched. One retry
      // covers a dev server that's still mid-recompile right after a
      // refresh; if that also fails, surface a retryable error state
      // instead of guessing.
      try {
        const { user: nextUser } = await api<{ user: AuthUser | null }>(
          "/auth/me",
        );
        setUser(nextUser);
        setAuthStatus(
          nextUser?.adminRole ? "authenticated" : "unauthenticated",
        );
        return nextUser;
      } catch {
        setAuthStatus("error");
        return undefined;
      }
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  // Clear workspace data (not auth status) on logout or when the restored
  // session turns out to be unauthenticated, so a later login starts clean.
  useEffect(() => {
    if (authStatus !== "unauthenticated") return;
    loadedRef.current.clear();
    inFlightRef.current.clear();
    setLoadedKeys(new Set());
    setProducts([]);
    setOrders([]);
    setMembers([]);
    setUsers([]);
    setCommissions([]);
    setMessages([]);
    setDamageReports([]);
    setReviews([]);
    setShapeQuestions([]);
    setHelpQuestions([]);
  }, [authStatus]);

  // Unread-message / open-damage-report counts drive sidebar nav badges that
  // are visible on every section, not just the Messages/Damage pages — so
  // (like auth) these two stay a small global fetch rather than per-section.
  // `fetchResource`'s loaded/in-flight guards mean visiting those sections
  // later never double-fetches.
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    void fetchResource("messages");
    void fetchResource("damageReports");
  }, [authStatus, fetchResource]);

  const ready = authStatus !== "initializing";

  const can = (permission: AdminPermission) =>
    (permissions[currentRole] as readonly string[]).includes(permission);

  return useMemo(
    () => ({
      ready,
      authStatus,
      loadedKeys,
      user,
      error,
      products,
      orders,
      members,
      users,
      commissions,
      messages,
      damageReports,
      reviews,
      shapeQuestions,
      helpQuestions,
      currentRole,
      can,
      async login(input: {
        email: string;
        password: string;
        rememberMe?: boolean;
      }) {
        setError("");
        const payload = await api<{ user: AuthUser }>("/auth/session", {
          method: "POST",
          body: JSON.stringify(input),
        });
        if (!payload.user.adminRole) {
          await api("/auth/logout", { method: "POST" });
          setUser(null);
          setAuthStatus("unauthenticated");
          throw new Error("این حساب به دفتر کوره دسترسی ندارد.");
        }
        setUser(payload.user);
        setAuthStatus("authenticated");
      },
      async forgotPassword(email: string) {
        return api<{ message: string }>("/auth/password/forgot", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
      },
      async resetPassword(input: {
        email: string;
        code: string;
        password: string;
      }) {
        return api<{ ok: boolean }>("/auth/password/reset", {
          method: "POST",
          body: JSON.stringify(input),
        });
      },
      async changePassword(input: {
        currentPassword: string;
        newPassword: string;
      }) {
        return api<{ ok: boolean }>("/auth/password", {
          method: "PATCH",
          body: JSON.stringify(input),
        });
      },
      async logout() {
        await api("/auth/logout", { method: "POST" });
        setUser(null);
        setAuthStatus("unauthenticated");
        // Resource arrays are cleared by the authStatus effect above.
      },
      /** Retries session restoration after an `authStatus === "error"`. */
      retryAuth() {
        return restoreSession();
      },
      loadSection,
      async setReviewHidden(id: string, hidden: boolean) {
        const saved = await api<AdminReview>(`/admin/reviews/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ hidden }),
        });
        setReviews((items) =>
          items.map((item) => (item.id === saved.id ? saved : item)),
        );
      },
      async deleteReview(id: string) {
        await api(`/admin/reviews/${id}`, { method: "DELETE" });
        setReviews((items) => items.filter((item) => item.id !== id));
      },
      async saveShapeQuestion(input: ShapeQuestionInput, id?: string) {
        const saved = await api<ShapeQuestion>(
          id ? `/admin/shape-questions/${id}` : "/admin/shape-questions",
          { method: id ? "PATCH" : "POST", body: JSON.stringify(input) },
        );
        setShapeQuestions((items) =>
          id
            ? items.map((item) => (item.id === saved.id ? saved : item))
            : [...items, saved],
        );
      },
      async deleteShapeQuestion(id: string) {
        await api(`/admin/shape-questions/${id}`, { method: "DELETE" });
        setShapeQuestions((items) => items.filter((item) => item.id !== id));
      },
      async reorderShapeQuestions(ids: string[]) {
        setShapeQuestions(
          await api<ShapeQuestion[]>("/admin/shape-questions/order", {
            method: "PUT",
            body: JSON.stringify({ ids }),
          }),
        );
      },
      async saveHelpQuestion(input: HelpQuestionInput, id?: string) {
        const saved = await api<HelpQuestion>(
          id ? `/admin/help-questions/${id}` : "/admin/help-questions",
          {
            method: id ? "PATCH" : "POST",
            body: JSON.stringify({ ...input, more: input.more ?? null }),
          },
        );
        setHelpQuestions((items) =>
          id
            ? items.map((item) => (item.id === saved.id ? saved : item))
            : [...items, saved],
        );
      },
      async deleteHelpQuestion(id: string) {
        await api(`/admin/help-questions/${id}`, { method: "DELETE" });
        setHelpQuestions((items) => items.filter((item) => item.id !== id));
      },
      async reorderHelpQuestions(ids: string[]) {
        setHelpQuestions(
          await api<HelpQuestion[]>("/admin/help-questions/order", {
            method: "PUT",
            body: JSON.stringify({ ids }),
          }),
        );
      },
      /**
       * Uploads a new product image file directly to Cloudinary: get signed
       * upload params from the API, POST the file straight to Cloudinary's
       * upload endpoint from the browser (bytes never transit through Nest),
       * then return the `{storage:"cloudinary", objectKey}` reference to
       * store in `draft.images` — `slug` is just a route param the API uses
       * to look up the product and namespace the signed folder by its
       * immutable id; for a not-yet-created product (no id yet) the API
       * signs an upload into an unassociated `rad/pending` folder instead.
       * Either way the API alone decides (and signs) the destination folder,
       * and re-validates the resulting public_id on save — never trusted
       * blindly from the client. `CLOUDINARY_API_SECRET` never reaches this
       * code; only the public `apiKey`/`cloudName` + a one-time signature do.
       */
      async uploadProductImage(slug: string, file: File) {
        const { cloudName, apiKey, timestamp, folder, signature } = await api<{
          cloudName: string;
          apiKey: string;
          timestamp: number;
          folder: string;
          signature: string;
        }>(
          `/admin/products/${encodeURIComponent(slug || "draft")}/images/sign`,
          {
            method: "POST",
            body: JSON.stringify({ mime: file.type }),
          },
        );
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", apiKey);
        body.append("timestamp", String(timestamp));
        body.append("folder", folder);
        body.append("signature", signature);
        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body },
        );
        if (!uploadResponse.ok) {
          throw new Error("بارگذاری تصویر به فضای ذخیره‌سازی ناموفق بود.");
        }
        const uploaded = (await uploadResponse.json()) as {
          public_id?: string;
        };
        if (!uploaded.public_id) {
          throw new Error("بارگذاری تصویر به فضای ذخیره‌سازی ناموفق بود.");
        }
        return {
          storage: "cloudinary" as const,
          objectKey: uploaded.public_id,
        };
      },
      async saveProduct(product: AdminProduct) {
        const payload = {
          slug: product.slug,
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          status: product.status,
          artist: product.artist,
          // Only send what the API's save contract needs per storage —
          // never the display-only `src` the API derived for a `cloudinary`
          // row (or a local blob: URL left over from an in-flight upload).
          images: product.images.map((image) =>
            image.storage === "cloudinary"
              ? { storage: "cloudinary" as const, objectKey: image.objectKey }
              : { storage: image.storage, src: image.src },
          ),
        };
        const exists = products.some((item) => item.id === product.id);
        const saved = exists
          ? await api<AdminProduct>(`/admin/products/${product.id}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            })
          : await api<AdminProduct>("/admin/products", {
              method: "POST",
              body: JSON.stringify(payload),
            });
        setProducts((items) => {
          if (items.some((item) => item.id === saved.id)) {
            return items.map((item) => (item.id === saved.id ? saved : item));
          }
          return [saved, ...items];
        });
      },
      async deleteProduct(id: string) {
        await api(`/admin/products/${id}`, { method: "DELETE" });
        setProducts((items) => items.filter((item) => item.id !== id));
      },
      async updateOrder(order: AdminOrder) {
        const saved = await api<AdminOrder>(`/admin/orders/${order.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: order.status }),
        });
        setOrders((items) =>
          items.map((item) => (item.id === saved.id ? saved : item)),
        );
      },
      async approvePayment(id: string) {
        const saved = await api<AdminOrder>(
          `/admin/orders/${id}/payment/approve`,
          {
            method: "POST",
          },
        );
        setOrders((items) =>
          items.map((item) => (item.id === saved.id ? saved : item)),
        );
        const refreshed = await api<AdminProduct[]>("/admin/products");
        setProducts(refreshed);
      },
      async rejectPayment(id: string, reason: string) {
        const saved = await api<AdminOrder>(
          `/admin/orders/${id}/payment/reject`,
          {
            method: "POST",
            body: JSON.stringify({ reason }),
          },
        );
        setOrders((items) =>
          items.map((item) => (item.id === saved.id ? saved : item)),
        );
        const refreshed = await api<AdminProduct[]>("/admin/products");
        setProducts(refreshed);
      },
      async setMessageStatus(
        id: string,
        status: AdminContactMessage["status"],
      ) {
        const saved = await api<AdminContactMessage>(`/admin/messages/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        setMessages((items) =>
          items.map((item) => (item.id === saved.id ? saved : item)),
        );
      },
      /** Replies as staff into a thread; `id` may be the root or any reply in it. */
      async replyToMessage(id: string, body: string) {
        const thread = await api<AdminContactMessage[]>(
          `/admin/messages/${id}/reply`,
          { method: "POST", body: JSON.stringify({ body }) },
        );
        setMessages((items) => {
          const byId = new Map(items.map((item) => [item.id, item]));
          for (const row of thread) byId.set(row.id, row);
          return [...byId.values()];
        });
      },
      async reviewDamageReport(
        id: string,
        review: {
          status: AdminDamageReport["status"];
          resolution?: AdminDamageReport["resolution"];
          note?: string;
        },
      ) {
        const saved = await api<AdminDamageReport>(
          `/admin/damage-reports/${id}`,
          {
            method: "PATCH",
            body: JSON.stringify(review),
          },
        );
        setDamageReports((items) =>
          items.map((item) => (item.id === saved.id ? saved : item)),
        );
      },
      async inviteMember(member: AdminMember) {
        const saved = await api<AdminMember>("/admin/members", {
          method: "POST",
          body: JSON.stringify({
            name: member.name,
            email: member.email,
            role: member.role,
          }),
        });
        setMembers((items) => [saved, ...items]);
      },
      async updateMember(member: AdminMember) {
        const saved = await api<AdminMember>(`/admin/members/${member.id}`, {
          method: "PATCH",
          body: JSON.stringify({ role: member.role, status: member.status }),
        });
        setMembers((items) =>
          items.map((item) => (item.id === saved.id ? saved : item)),
        );
      },
      async beginCommissionReview(id: string) {
        const saved = await api<AdminCommission>(
          `/admin/commissions/${id}/review`,
          {
            method: "POST",
          },
        );
        setCommissions((items) =>
          items.map((item) => (item.id === saved.id ? saved : item)),
        );
        return saved;
      },
      async decideCommission(input: {
        id: string;
        decision:
          "approve" | "request_change" | "offer_alternative" | "decline";
        reason?: { fa: string; en: string };
        alternative?: { fa: string; en: string };
        change?: {
          whatChanged: { fa: string; en: string };
          whyNecessary: { fa: string; en: string };
          priceImpact: { fa: string; en: string };
          timeImpact: { fa: string; en: string };
        };
      }) {
        const saved = await api<AdminCommission>(
          `/admin/commissions/${input.id}/decide`,
          {
            method: "POST",
            body: JSON.stringify({
              decision: input.decision,
              reason: input.reason,
              alternative: input.alternative,
              change: input.change,
            }),
          },
        );
        setCommissions((items) =>
          items.map((item) => (item.id === saved.id ? saved : item)),
        );
        return saved;
      },
      async messageCommission(
        id: string,
        body: { fa: string; en: string },
        internal?: boolean,
      ) {
        const saved = await api<AdminCommission>(
          `/admin/commissions/${id}/messages`,
          {
            method: "POST",
            body: JSON.stringify({ body, internal }),
          },
        );
        setCommissions((items) =>
          items.map((item) => (item.id === saved.id ? saved : item)),
        );
        return saved;
      },
    }),
    [
      authStatus,
      commissions,
      currentRole,
      damageReports,
      error,
      helpQuestions,
      loadedKeys,
      loadSection,
      members,
      messages,
      orders,
      products,
      ready,
      restoreSession,
      reviews,
      shapeQuestions,
      user,
      users,
    ],
  );
}
