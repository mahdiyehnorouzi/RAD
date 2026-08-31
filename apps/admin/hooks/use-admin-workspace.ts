"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@rad/types";
import { api } from "../lib/api";
import { permissions, type AdminMember, type AdminOrder, type AdminProduct, type AdminRole } from "../lib/admin-data";

export function useAdminWorkspace() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [members, setMembers] = useState<AdminMember[]>([]);
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
      return nextUser;
    }
    const [productPayload, orderPayload, memberPayload] = await Promise.all([
      api<AdminProduct[]>("/admin/products"),
      api<AdminOrder[]>("/admin/orders"),
      api<AdminMember[]>("/admin/members"),
    ]);
    setProducts(productPayload);
    setOrders(orderPayload);
    setMembers(memberPayload);
    return nextUser;
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, [refresh]);

  const can = (permission: "product.write" | "product.delete" | "order.write" | "member.write") =>
    (permissions[currentRole] as readonly string[]).includes(permission);

  return useMemo(() => ({
    ready,
    user,
    error,
    products,
    orders,
    members,
    currentRole,
    can,
    async login(input: { email: string; password: string }) {
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
    async logout() {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      setProducts([]);
      setOrders([]);
      setMembers([]);
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
  }), [currentRole, error, members, orders, products, ready, refresh, user]);
}
