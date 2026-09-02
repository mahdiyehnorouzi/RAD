import { api, ApiError } from "./client";
import type {Product} from "@rad/types";

export async function fetchProducts(category?: string): Promise<Product[]> {
  const query = category && category !== "all" ? `?category=${category}` : "";
  return api<Product[]>(`/products${query}`);
}

export async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    return await api<Product>(`/products/${slug}`, { cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchRelatedProducts(slug: string): Promise<Product[]> {
  return api<Product[]>(`/products/${slug}/related`);
}
