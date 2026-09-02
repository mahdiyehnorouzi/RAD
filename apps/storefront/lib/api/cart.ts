import { api } from "./client";

type CartPayload = { slugs: string[] };

export async function fetchCart() {
  return api<CartPayload>("/cart");
}

export async function addCartItem(slug: string) {
  return api<CartPayload>("/cart/items", {
    method: "POST",
    body: JSON.stringify({ slug }),
  });
}

export async function removeCartItem(slug: string) {
  return api<CartPayload>(`/cart/items/${slug}`, { method: "DELETE" });
}

export async function clearCart() {
  return api<CartPayload>("/cart", { method: "DELETE" });
}
