import type { Product } from "@rad/types";
import { api, ApiError } from "./client";

export async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    return await api<Product>(`/products/${slug}`, { cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
