import type { Artwork } from "@rad/types";
import { fetchArtworks } from "@/lib/api";
import { fallbackArtworks } from "./fallback";
import { mergeArtworks } from "./merge";

export type ArtworksLoad = {
  artworks: Artwork[];
  /** False when the API could not be reached and `artworks` is the registry fallback. */
  live: boolean;
};

export async function loadArtworks(
  init?: Parameters<typeof fetchArtworks>[0],
): Promise<ArtworksLoad> {
  try {
    const remote = await fetchArtworks(init);
    const list = Array.isArray(remote) ? remote : [];
    return {
      artworks: list.length
        ? mergeArtworks(list, fallbackArtworks)
        : fallbackArtworks,
      live: true,
    };
  } catch {
    return { artworks: fallbackArtworks, live: false };
  }
}
