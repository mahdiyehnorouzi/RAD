import type { Artwork } from "@rad/types";
import { fetchArtworks } from "@/lib/api";
import { logRecovered } from "@/lib/log";
import { fallbackArtworks } from "./fallback";
import { catalogSource } from "./source";

export type ArtworksOrigin = "api" | "registry";

type ArtworksLoad = {
  artworks: Artwork[];
  /** `registry` when the API was skipped or unreachable and `artworks` is the bundled copy — never `"registry"` in production, see `source.ts`. */
  origin: ArtworksOrigin;
};

/**
 * A successful API response is returned exactly as given, including a
 * genuinely empty list — the registry is never merged into it. The
 * registry is used only when `catalogSource()` allows it (never in
 * production) and the API call itself was skipped or failed.
 */
export async function loadArtworks(
  init?: Parameters<typeof fetchArtworks>[0],
): Promise<ArtworksLoad> {
  const source = catalogSource();
  if (source === "registry") {
    return { artworks: fallbackArtworks, origin: "registry" };
  }
  try {
    const remote = await fetchArtworks(init);
    const list = Array.isArray(remote) ? remote : [];
    return { artworks: list, origin: "api" };
  } catch (error) {
    if (source === "api") throw error;
    logRecovered("catalog", error);
    return { artworks: fallbackArtworks, origin: "registry" };
  }
}
