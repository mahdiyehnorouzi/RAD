"use client";

import { useEffect, useMemo, useState } from "react";
import { permissions, seedMembers, seedOrders, seedProducts, type AdminMember, type AdminOrder, type AdminProduct, type AdminRole } from "../lib/admin-data";

const STORAGE_KEY = "rad-admin-workspace-v1";

export function useAdminWorkspace() {
  const [products, setProducts] = useState<AdminProduct[]>(seedProducts);
  const [orders, setOrders] = useState<AdminOrder[]>(seedOrders);
  const [members, setMembers] = useState<AdminMember[]>(seedMembers);
  const [ready, setReady] = useState(false);
  const currentRole: AdminRole = "owner";

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as { products: AdminProduct[]; orders: AdminOrder[]; members: AdminMember[] };
        setProducts(data.products);
        setOrders(data.orders);
        setMembers(data.members);
      }
    } catch { /* Keep seed data when storage is unavailable or malformed. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, orders, members })); } catch { /* In-memory state remains usable. */ }
  }, [members, orders, products, ready]);

  const can = (permission: "product.write" | "product.delete" | "order.write" | "member.write") =>
    (permissions[currentRole] as readonly string[]).includes(permission);

  return useMemo(() => ({
    products,
    orders,
    members,
    currentRole,
    can,
    saveProduct(product: AdminProduct) { setProducts((items) => items.some((item) => item.id === product.id) ? items.map((item) => item.id === product.id ? product : item) : [product, ...items]); },
    deleteProduct(id: string) { setProducts((items) => items.filter((item) => item.id !== id)); },
    updateOrder(order: AdminOrder) { setOrders((items) => items.map((item) => item.id === order.id ? order : item)); },
    inviteMember(member: AdminMember) { setMembers((items) => [member, ...items]); },
    updateMember(member: AdminMember) { setMembers((items) => items.map((item) => item.id === member.id ? member : item)); },
  }), [members, orders, products]);
}
