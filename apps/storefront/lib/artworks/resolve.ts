import type { Artwork } from "@rad/types";
import { fetchArtwork } from "@/lib/api";
import { fallbackArtworks } from "./fallback";
import { findArtwork } from "./find";
import { mergeArtwork } from "./merge";

class ArtworkUnreachableError extends Error {
  constructor(key: string, cause: unknown) {
    super(`Artwork API unreachable while loading "${key}"`, { cause });
  }
}

/**
 * Server lookup by RAD number or slug. `null` means the API answered 404 (unknown
 * or draft). The registry is used only when the API is unreachable.
 */
export async function resolveArtwork(key: string): Promise<Artwork | null> {
  try {
    const live = await fetchArtwork(key);
    return live
      ? mergeArtwork(live, findArtwork(fallbackArtworks, live.slug))
      : null;
  } catch (error) {
    const local = findArtwork(fallbackArtworks, key);
    if (local) return local;
    throw new ArtworkUnreachableError(key, error);
  }
}
