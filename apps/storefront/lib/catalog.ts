import { api, API_BASE } from "./api";
import type { Product } from "@rad/types";

export async function fetchProducts(category?: string): Promise<Product[]> {
  const query = category && category !== "all" ? `?category=${category}` : "";
  return api<Product[]>(`/products${query}`);
}

export async function fetchProduct(slug: string): Promise<Product | null> {
  const response = await fetch(`${API_BASE}/products/${slug}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to load product");
  return response.json() as Promise<Product>;
}

export async function fetchRelatedProducts(slug: string): Promise<Product[]> {
  return api<Product[]>(`/products/${slug}/related`);
}
