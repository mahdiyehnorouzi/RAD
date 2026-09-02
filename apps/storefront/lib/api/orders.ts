import type {Order} from "@rad/types";
import type {PlaceOrderInput} from "@/types/api";
import { api } from "./client";

export type { PlaceOrderInput };

export async function fetchOrders() {
  return api<Order[]>("/orders");
}

export async function createOrder(order: PlaceOrderInput) {
  return api<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}
