import type { Order } from "@rad/types";
import { api } from "./client";

export async function fetchOrder(id: string) {
  return api<Order>(`/orders/${encodeURIComponent(id)}`);
}
