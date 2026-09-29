import type { Artwork } from "@rad/types";
import { api, ApiError } from "./client";

export async function fetchArtworks(
  init?: Parameters<typeof api>[1],
): Promise<Artwork[]> {
  return api<Artwork[]>("/artworks", init);
}

/** `key` is a RAD number or a slug; `null` when the API answers 404. */
export async function fetchArtwork(key: string): Promise<Artwork | null> {
  try {
    return await api<Artwork>(`/artworks/${encodeURIComponent(key)}`, {
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
