"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  type AdminUser,
  type HelpQuestion,
  type HelpQuestionInput,
  type ShapeQuestion,
  type ShapeQuestionInput,
} from "../lib/admin-data";

export function useAdminWorkspace() {
  const [user, setUser] = useState<AuthUser | null>(null);
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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const currentRole: AdminRole = (user?.adminRole as AdminRole | undefined) ?? "viewer";

  const refresh = useCallback(async (session?: AuthUser | null) => {
    const nextUser = session === undefined ? (await api<{ user: AuthUser | null }>("/auth/me")).user : session;
    setUser(nextUser);
    if (!nextUser?.adminRole) {
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
      return nextUser;
    }
    const [
      productPayload,
      orderPayload,
      memberPayload,
      userPayload,
      commissionPayload,
      messagePayload,
      damagePayload,
      reviewPayload,
      shapePayload,
      helpPayload,
    ] = await Promise.all([
      api<AdminProduct[]>("/admin/products"),
      api<AdminOrder[]>("/admin/orders"),
      api<AdminMember[]>("/admin/members"),
      api<AdminUser[]>("/admin/users"),
      api<AdminCommission[]>("/admin/commissions"),
      api<AdminContactMessage[]>("/admin/messages"),
      api<AdminDamageReport[]>("/admin/damage-reports"),
      api<AdminReview[]>("/admin/reviews"),
      api<ShapeQuestion[]>("/admin/shape-questions"),
      api<HelpQuestion[]>("/admin/help-questions"),
    ]);
    setProducts(productPayload);
    setOrders(orderPayload);
    setMembers(memberPayload);
    setUsers(userPayload);
    setCommissions(commissionPayload);
    setMessages(messagePayload);
    setDamageReports(damagePayload);
    setReviews(reviewPayload);
    setShapeQuestions(shapePayload);
    setHelpQuestions(helpPayload);
    return nextUser;
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, [refresh]);

  const can = (permission: AdminPermission) =>
    (permissions[currentRole] as readonly string[]).includes(permission);

  return useMemo(() => ({
    ready,
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
    async login(input: { email: string; password: string; rememberMe?: boolean }) {
      setError("");
      const payload = await api<{ user: AuthUser }>("/auth/session", {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (!payload.user.adminRole) {
        await api("/auth/logout", { method: "POST" });
        setUser(null);
        throw new Error("این حساب به دفتر کوره دسترسی ندارد.");
      }
      await refresh(payload.user);
    },
    async forgotPassword(email: string) {
      return api<{ message: string }>("/auth/password/forgot", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    async resetPassword(input: { email: string; code: string; password: string }) {
      return api<{ ok: boolean }>("/auth/password/reset", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    async changePassword(input: { currentPassword: string; newPassword: string }) {
      return api<{ ok: boolean }>("/auth/password", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
    async logout() {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
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
    },
    async setReviewHidden(id: string, hidden: boolean) {
      const saved = await api<AdminReview>(`/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ hidden }),
      });
      setReviews((items) => items.map((item) => (item.id === saved.id ? saved : item)));
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
        id ? items.map((item) => (item.id === saved.id ? saved : item)) : [...items, saved],
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
        id ? items.map((item) => (item.id === saved.id ? saved : item)) : [...items, saved],
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
    async saveProduct(product: AdminProduct) {
      const payload = {
        slug: product.slug,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        status: product.status,
        artist: product.artist,
        images: product.images,
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
      setOrders((items) => items.map((item) => (item.id === saved.id ? saved : item)));
    },
    async approvePayment(id: string) {
      const saved = await api<AdminOrder>(`/admin/orders/${id}/payment/approve`, {
        method: "POST",
      });
      setOrders((items) => items.map((item) => (item.id === saved.id ? saved : item)));
      const refreshed = await api<AdminProduct[]>("/admin/products");
      setProducts(refreshed);
    },
    async rejectPayment(id: string, reason: string) {
      const saved = await api<AdminOrder>(`/admin/orders/${id}/payment/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setOrders((items) => items.map((item) => (item.id === saved.id ? saved : item)));
      const refreshed = await api<AdminProduct[]>("/admin/products");
      setProducts(refreshed);
    },
    async setMessageStatus(id: string, status: AdminContactMessage["status"]) {
      const saved = await api<AdminContactMessage>(`/admin/messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessages((items) => items.map((item) => (item.id === saved.id ? saved : item)));
    },
    async reviewDamageReport(
      id: string,
      review: { status: AdminDamageReport["status"]; resolution?: AdminDamageReport["resolution"]; note?: string },
    ) {
      const saved = await api<AdminDamageReport>(`/admin/damage-reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify(review),
      });
      setDamageReports((items) => items.map((item) => (item.id === saved.id ? saved : item)));
    },
    async inviteMember(member: AdminMember) {
      const saved = await api<AdminMember>("/admin/members", {
        method: "POST",
        body: JSON.stringify({ name: member.name, email: member.email, role: member.role }),
      });
      setMembers((items) => [saved, ...items]);
    },
    async updateMember(member: AdminMember) {
      const saved = await api<AdminMember>(`/admin/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: member.role, status: member.status }),
      });
      setMembers((items) => items.map((item) => (item.id === saved.id ? saved : item)));
    },
    async beginCommissionReview(id: string) {
      const saved = await api<AdminCommission>(`/admin/commissions/${id}/review`, {
        method: "POST",
      });
      setCommissions((items) => items.map((item) => (item.id === saved.id ? saved : item)));
      return saved;
    },
    async decideCommission(input: {
      id: string;
      decision: "approve" | "request_change" | "offer_alternative" | "decline";
      reason?: { fa: string; en: string };
      alternative?: { fa: string; en: string };
      change?: {
        whatChanged: { fa: string; en: string };
        whyNecessary: { fa: string; en: string };
        priceImpact: { fa: string; en: string };
        timeImpact: { fa: string; en: string };
      };
    }) {
      const saved = await api<AdminCommission>(`/admin/commissions/${input.id}/decide`, {
        method: "POST",
        body: JSON.stringify({
          decision: input.decision,
          reason: input.reason,
          alternative: input.alternative,
          change: input.change,
        }),
      });
      setCommissions((items) => items.map((item) => (item.id === saved.id ? saved : item)));
      return saved;
    },
    async messageCommission(id: string, body: { fa: string; en: string }, internal?: boolean) {
      const saved = await api<AdminCommission>(`/admin/commissions/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body, internal }),
      });
      setCommissions((items) => items.map((item) => (item.id === saved.id ? saved : item)));
      return saved;
    },
  }), [commissions, currentRole, damageReports, error, helpQuestions, members, messages, orders, products, ready, refresh, reviews, shapeQuestions, user, users]);
}
