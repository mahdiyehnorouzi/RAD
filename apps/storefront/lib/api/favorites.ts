import { api } from "./client";

export async function fetchFavorites() {
  return api<{ slugs: string[] }>("/favorites");
}

export async function toggleFavorite(slug: string) {
  return api<{ slugs: string[]; added: boolean }>(`/favorites/${slug}`, {
    method: "POST",
  });
}
