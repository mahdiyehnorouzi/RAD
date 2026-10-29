"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthUser } from "@rad/types";
import { api } from "../lib/api";
import {
  isRemoteMediaStorage,
  permissions,
  type AdminCommission,
  type AdminContactMessage,
  type AdminDamageReport,
  type AdminMember,
  type AdminOrder,
  type AdminPermission,
  type AdminProduct,
  type AdminRemoteMediaStorage,
  type AdminReview,
  type AdminRole,
  type AdminSection,
  type AdminUser,
  type HelpQuestion,
  type HelpQuestionInput,
  type ProductAttribute,
  type ProductAttributeInput,
  type ShapeQuestion,
  type ShapeQuestionInput,
} from "../lib/admin-data";
import {
  buildUploadRequest,
  resolveUploadedObjectKey,
  type SignedUpload,
} from "../lib/media-upload";
import { ResourceGate } from "../lib/resource-gate";

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
  | "helpQuestions"
  | "productAttributes";

/**
 * Which resources a section actually renders. Keeps the old "fetch
 * everything" behavior from happening on every mount — only the active
 * section's own data (plus whatever it cross-references, e.g. order status
 * panels needing the order's own messages/damage reports) is requested.
 */
const resourceKeys: ResourceKey[] = [
  "products",
  "orders",
  "members",
  "users",
  "commissions",
  "messages",
  "damageReports",
  "reviews",
  "shapeQuestions",
  "helpQuestions",
  "productAttributes",
];

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
  attributes: ["productAttributes"],
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
  const [productAttributes, setProductAttributes] = useState<
    ProductAttribute[]
  >([]);
  const currentRole: AdminRole =
    (user?.adminRole as AdminRole | undefined) ?? "viewer";

  // Tracks which resources are loaded or in flight, so switching sections
  // back and forth — or React 18 dev-mode's double effect invocation —
  // never issues duplicate requests for data already fetched/loading.
  // `ResourceGate` also separates an initial failure (nothing to show) from
  // a background refresh failure (keep the rows already on screen) and drops
  // an older response when a newer request for the same resource is in flight.
  const gateRef = useRef(new ResourceGate<ResourceKey>());
  const initialFlightRef = useRef<Map<ResourceKey, Promise<unknown>>>(
    new Map(),
  );
  // Bumped on logout so a response that arrives afterwards cannot write
  // rows back into a signed-out workspace.
  const sessionEpochRef = useRef(0);
  // Bumped when a mutation writes a list locally, so an in-flight refresh
  // that started before that write cannot replace the newer rows.
  const writeEpochRef = useRef(new Map<ResourceKey, number>());
  const bumpWrite = useCallback((key: ResourceKey) => {
    writeEpochRef.current.set(key, (writeEpochRef.current.get(key) ?? 0) + 1);
  }, []);
  // Reactive mirror of the gate, so components can tell "hasn't loaded
  // yet" (show a skeleton) apart from "loaded and genuinely zero".
  const [loadedKeys, setLoadedKeys] = useState<Set<ResourceKey>>(new Set());
  const [loadErrors, setLoadErrors] = useState<Set<ResourceKey>>(new Set());
  const [refreshingKeys, setRefreshingKeys] = useState<Set<ResourceKey>>(
    new Set(),
  );
  const [refreshErrors, setRefreshErrors] = useState<Set<ResourceKey>>(
    new Set(),
  );

  const publishGate = useCallback(() => {
    const loaded = new Set<ResourceKey>();
    const errors = new Set<ResourceKey>();
    const refreshing = new Set<ResourceKey>();
    const refreshFailed = new Set<ResourceKey>();
    for (const key of resourceKeys) {
      const status = gateRef.current.status(key);
      if (status.loaded) loaded.add(key);
      if (status.loadError) errors.add(key);
      if (status.refreshing) refreshing.add(key);
      if (status.refreshError) refreshFailed.add(key);
    }
    setLoadedKeys(loaded);
    setLoadErrors(errors);
    setRefreshingKeys(refreshing);
    setRefreshErrors(refreshFailed);
  }, []);

  // Fetches one resource and returns the payload. Callers commit it only
  // when this request is still the latest one for that key.
  const readResource = useCallback(async (key: ResourceKey) => {
    switch (key) {
      case "products":
        return api<AdminProduct[]>("/admin/products");
      case "orders":
        return api<AdminOrder[]>("/admin/orders");
      case "members":
        return api<AdminMember[]>("/admin/members");
      case "users":
        return api<AdminUser[]>("/admin/users");
      case "commissions":
        return api<AdminCommission[]>("/admin/commissions");
      case "messages":
        return api<AdminContactMessage[]>("/admin/messages");
      case "damageReports":
        return api<AdminDamageReport[]>("/admin/damage-reports");
      case "reviews":
        return api<AdminReview[]>("/admin/reviews");
      case "shapeQuestions":
        return api<ShapeQuestion[]>("/admin/shape-questions");
      case "helpQuestions":
        return api<HelpQuestion[]>("/admin/help-questions");
      case "productAttributes":
        return api<ProductAttribute[]>("/admin/product-attributes");
    }
  }, []);

  const commitResource = useCallback((key: ResourceKey, data: unknown) => {
    switch (key) {
      case "products":
        setProducts(data as AdminProduct[]);
        break;
      case "orders":
        setOrders(data as AdminOrder[]);
        break;
      case "members":
        setMembers(data as AdminMember[]);
        break;
      case "users":
        setUsers(data as AdminUser[]);
        break;
      case "commissions":
        setCommissions(data as AdminCommission[]);
        break;
      case "messages":
        setMessages(data as AdminContactMessage[]);
        break;
      case "damageReports":
        setDamageReports(data as AdminDamageReport[]);
        break;
      case "reviews":
        setReviews(data as AdminReview[]);
        break;
      case "shapeQuestions":
        setShapeQuestions(data as ShapeQuestion[]);
        break;
      case "helpQuestions":
        setHelpQuestions(data as HelpQuestion[]);
        break;
      case "productAttributes":
        setProductAttributes(data as ProductAttribute[]);
        break;
    }
  }, []);

  const runResource = useCallback(
    (key: ResourceKey, mode: "initial" | "refresh"): Promise<unknown> => {
      if (mode === "initial") {
        const existing = initialFlightRef.current.get(key);
        if (existing) return existing;
        if (gateRef.current.status(key).loaded) return Promise.resolve();
      }
      const generation = gateRef.current.begin(key, mode);
      if (generation == null) {
        return initialFlightRef.current.get(key) ?? Promise.resolve();
      }
      const epoch = sessionEpochRef.current;
      publishGate();
      const promise = (async () => {
        try {
          const seenWrite = writeEpochRef.current.get(key) ?? 0;
          const data = await readResource(key);
          if (sessionEpochRef.current !== epoch) return;
          if ((writeEpochRef.current.get(key) ?? 0) !== seenWrite) {
            // A mutation landed while this response was in flight. Drop the
            // payload, but clear the spinner — the local write is newer.
            gateRef.current.settle(key, generation, true);
            return;
          }
          if (gateRef.current.settle(key, generation, true) === "applied") {
            commitResource(key, data);
          }
        } catch {
          if (sessionEpochRef.current !== epoch) return;
          gateRef.current.settle(key, generation, false);
        } finally {
          if (sessionEpochRef.current === epoch) publishGate();
        }
      })();
      if (mode === "initial") {
        initialFlightRef.current.set(key, promise);
        void promise.finally(() => {
          if (initialFlightRef.current.get(key) === promise) {
            initialFlightRef.current.delete(key);
          }
        });
      }
      return promise;
    },
    [commitResource, publishGate, readResource],
  );

  const fetchResource = useCallback(
    (key: ResourceKey) => runResource(key, "initial"),
    [runResource],
  );

  // Polls the inbox so a reply the customer sends while an admin already
  // has this tab open still shows up — there is no WebSocket/SSE channel
  // in this app to push it instead. Only runs once messages have been
  // loaded at least once (the global-badge effect below triggers that),
  // and only while authenticated. A failed poll keeps the rows already
  // shown; it does not replace them with an empty or full-screen error.
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const timer = window.setInterval(() => {
      if (gateRef.current.status("messages").loaded) {
        void runResource("messages", "refresh");
      }
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [authStatus, runResource]);

  /** Re-runs a failed initial load, or a failed background refresh. */
  const retryResource = useCallback(
    (key: ResourceKey) =>
      runResource(
        key,
        gateRef.current.status(key).loaded ? "refresh" : "initial",
      ),
    [runResource],
  );

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
    sessionEpochRef.current += 1;
    gateRef.current.reset();
    initialFlightRef.current.clear();
    writeEpochRef.current.clear();
    setLoadedKeys(new Set());
    setLoadErrors(new Set());
    setRefreshingKeys(new Set());
    setRefreshErrors(new Set());
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
    setProductAttributes([]);
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
      productAttributes,
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
      loadErrors,
      refreshingKeys,
      refreshErrors,
      retryResource,
      async setReviewHidden(id: string, hidden: boolean) {
        const saved = await api<AdminReview>(`/admin/reviews/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ hidden }),
        });
        bumpWrite("reviews");
        setReviews((items) =>
          items.map((item) => (item.id === saved.id ? saved : item)),
        );
      },
      async deleteReview(id: string) {
        await api(`/admin/reviews/${id}`, { method: "DELETE" });
        bumpWrite("reviews");
        setReviews((items) => items.filter((item) => item.id !== id));
      },
      async saveShapeQuestion(input: ShapeQuestionInput, id?: string) {
        const saved = await api<ShapeQuestion>(
          id ? `/admin/shape-questions/${id}` : "/admin/shape-questions",
          { method: id ? "PATCH" : "POST", body: JSON.stringify(input) },
        );
        bumpWrite("shapeQuestions");
        setShapeQuestions((items) =>
          id
            ? items.map((item) => (item.id === saved.id ? saved : item))
            : [...items, saved],
        );
      },
      async deleteShapeQuestion(id: string) {
        await api(`/admin/shape-questions/${id}`, { method: "DELETE" });
        bumpWrite("shapeQuestions");
        setShapeQuestions((items) => items.filter((item) => item.id !== id));
      },
      async reorderShapeQuestions(ids: string[]) {
        const saved = await api<ShapeQuestion[]>(
          "/admin/shape-questions/order",
          {
            method: "PUT",
            body: JSON.stringify({ ids }),
          },
        );
        bumpWrite("shapeQuestions");
        setShapeQuestions(saved);
      },
      async saveHelpQuestion(input: HelpQuestionInput, id?: string) {
        const saved = await api<HelpQuestion>(
          id ? `/admin/help-questions/${id}` : "/admin/help-questions",
          {
            method: id ? "PATCH" : "POST",
            body: JSON.stringify({ ...input, more: input.more ?? null }),
          },
        );
        bumpWrite("helpQuestions");
        setHelpQuestions((items) =>
          id
            ? items.map((item) => (item.id === saved.id ? saved : item))
            : [...items, saved],
        );
      },
      async deleteHelpQuestion(id: string) {
        await api(`/admin/help-questions/${id}`, { method: "DELETE" });
        bumpWrite("helpQuestions");
        setHelpQuestions((items) => items.filter((item) => item.id !== id));
      },
      async reorderHelpQuestions(ids: string[]) {
        const saved = await api<HelpQuestion[]>("/admin/help-questions/order", {
          method: "PUT",
          body: JSON.stringify({ ids }),
        });
        bumpWrite("helpQuestions");
        setHelpQuestions(saved);
      },
      async saveProductAttribute(input: ProductAttributeInput, id?: string) {
        const saved = await api<ProductAttribute>(
          id ? `/admin/product-attributes/${id}` : "/admin/product-attributes",
          { method: id ? "PATCH" : "POST", body: JSON.stringify(input) },
        );
        setProductAttributes((items) =>
          id
            ? items.map((item) => (item.id === saved.id ? saved : item))
            : [...items, saved],
        );
      },
      async deleteProductAttribute(id: string) {
        await api(`/admin/product-attributes/${id}`, { method: "DELETE" });
        setProductAttributes((items) => items.filter((item) => item.id !== id));
      },
      async reorderProductAttributes(ids: string[]) {
        setProductAttributes(
          await api<ProductAttribute[]>("/admin/product-attributes/order", {
            method: "PUT",
            body: JSON.stringify({ ids }),
          }),
        );
      },
      /** Active attributes assigned to one (Persian-label) product category, in display order. */
      async fetchAttributesForCategory(category: string) {
        return api<ProductAttribute[]>(
          `/admin/product-attributes/by-category/${encodeURIComponent(category)}`,
        );
      },
      /**
       * Uploads a new product image file directly to the active storage
       * provider: get signed upload params from the API, POST the file
       * straight to the provider's upload endpoint from the browser (bytes
       * never transit through Nest), then return the `{storage, objectKey}`
       * reference to store in `draft.images` — `slug` is just a route param
       * the API uses to look up the product and namespace the signed
       * folder by its immutable id; for a not-yet-created product (no id
       * yet) the API signs an upload into an unassociated `rad/pending`
       * folder instead. Either way the API alone decides (and signs) the
       * destination folder, and re-validates the resulting object key on
       * save — never trusted blindly from the client.
       *
       * Which provider is active (`signed.provider`) is decided entirely
       * server-side by `MEDIA_STORAGE_PROVIDER` (see
       * `apps/api/src/storage`) — `buildUploadRequest`/
       * `resolveUploadedObjectKey` (`../lib/media-upload`) do the
       * provider-specific part (request shape, response parsing); this
       * function only owns the XHR plumbing (progress/abort/error), which
       * is identical either way.
       */
      async uploadProductImage(
        slug: string,
        file: File,
        onProgress?: (value: number) => void,
        signal?: AbortSignal,
      ) {
        const route = `/admin/products/${encodeURIComponent(slug || "draft")}`;
        const signed = await api<SignedUpload>(`${route}/images/sign`, {
          method: "POST",
          body: JSON.stringify({ mime: file.type, size: file.size }),
          signal,
        });
        const { url: uploadUrl, body } = buildUploadRequest(signed, file);
        const objectKey = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const abort = () => xhr.abort();
          const finish = () => signal?.removeEventListener("abort", abort);
          xhr.open("POST", uploadUrl);
          xhr.timeout = 10 * 60 * 1000;
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable)
              onProgress?.(Math.round((event.loaded / event.total) * 100));
          };
          xhr.onload = () => {
            finish();
            if (xhr.status < 200 || xhr.status >= 300)
              return reject(
                new Error(
                  xhr.status === 400
                    ? "محتوای فایل معتبر نیست یا فضای ذخیره‌سازی آن را نمی‌پذیرد."
                    : "بارگذاری ناموفق بود. دوباره تلاش کنید.",
                ),
              );
            try {
              resolve(resolveUploadedObjectKey(signed, xhr.responseText));
            } catch (error) {
              reject(
                error instanceof Error
                  ? error
                  : new Error("پاسخ بارگذاری معتبر نیست. دوباره تلاش کنید."),
              );
            }
          };
          xhr.onerror = xhr.ontimeout = () => {
            finish();
            reject(new Error("ارتباط قطع شد. دوباره تلاش کنید."));
          };
          xhr.onabort = () => {
            finish();
            reject(new Error("بارگذاری لغو شد."));
          };
          signal?.addEventListener("abort", abort, { once: true });
          if (signal?.aborted) {
            finish();
            reject(new Error("بارگذاری لغو شد."));
            return;
          }
          xhr.send(body);
        });
        return api<{ storage: AdminRemoteMediaStorage; objectKey: string }>(
          `${route}/media/verify`,
          {
            method: "POST",
            body: JSON.stringify({ objectKey, kind: signed.resourceType }),
            signal,
          },
        );
      },
      async saveProduct(product: AdminProduct) {
        const payload = {
          slug: product.slug,
          name: product.name,
          description: product.description,
          subtitle: product.subtitle,
          category: product.category,
          price: product.price,
          status: product.status,
          artist: product.artist,
          // Only send what the API's save contract needs per storage —
          // never the display-only `src` the API derived for a remote-media
          // row (or a local blob: URL left over from an in-flight upload).
          images: product.images.map((image) =>
            isRemoteMediaStorage(image.storage)
              ? { storage: image.storage, objectKey: image.objectKey }
              : { storage: image.storage, src: image.src },
          ),
          attributeValues: product.attributeValues ?? {},
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
        bumpWrite("messages");
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
        bumpWrite("messages");
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
        bumpWrite("members");
        setMembers((items) => [saved, ...items]);
      },
      async updateMember(member: AdminMember) {
        const saved = await api<AdminMember>(`/admin/members/${member.id}`, {
          method: "PATCH",
          body: JSON.stringify({ role: member.role, status: member.status }),
        });
        bumpWrite("members");
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
      bumpWrite,
      authStatus,
      commissions,
      currentRole,
      damageReports,
      error,
      helpQuestions,
      loadedKeys,
      loadErrors,
      refreshingKeys,
      refreshErrors,
      loadSection,
      retryResource,
      members,
      messages,
      orders,
      productAttributes,
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
