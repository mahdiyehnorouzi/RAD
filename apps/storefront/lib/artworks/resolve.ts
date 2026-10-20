import type { Artwork } from "@rad/types";
import { fetchArtwork } from "@/lib/api";
import { logRecovered } from "@/lib/log";
import { fallbackArtworks } from "./fallback";
import { findArtwork } from "./find";
import { catalogSource } from "./source";

export class ArtworkUnreachableError extends Error {
  constructor(key: string, cause: unknown) {
    super(`Artwork API unreachable while loading "${key}"`, { cause });
  }
}

/**
 * Server lookup by RAD number or slug. `null` means the API answered 404
 * (unknown or draft) — never confused with an unreachable API, which
 * throws instead. A successful response is returned exactly as the API
 * gave it: the bundled registry is never merged into a successful
 * response, even when its images/media are empty, so production can never
 * show stale/static data as if it were current. The registry is only ever
 * used when `catalogSource()` allows it (never in production — see
 * `source.ts`) and the API call itself failed.
 */
export async function resolveArtwork(key: string): Promise<Artwork | null> {
  const source = catalogSource();
  if (source === "registry") return findArtwork(fallbackArtworks, key) ?? null;
  try {
    return await fetchArtwork(key);
  } catch (error) {
    const local = source === "auto" && findArtwork(fallbackArtworks, key);
    if (!local) throw new ArtworkUnreachableError(key, error);
    logRecovered(`artwork ${key}`, error);
    return local;
  }
}
