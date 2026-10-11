import type { Artwork } from "@rad/types";
import { fetchArtworks } from "@/lib/api";
import { logRecovered } from "@/lib/log";
import { fallbackArtworks } from "./fallback";
import { mergeArtworks } from "./merge";
import { catalogSource } from "./source";

export type ArtworksOrigin = "api" | "registry";

type ArtworksLoad = {
  artworks: Artwork[];
  /** `registry` when the API was skipped or unreachable and `artworks` is the bundled copy. */
  origin: ArtworksOrigin;
};

export async function loadArtworks(
  init?: Parameters<typeof fetchArtworks>[0],
): Promise<ArtworksLoad> {
  const source = catalogSource();
  if (source === "registry") {
    return { artworks: fallbackArtworks, origin: "registry" };
  }
  // TEMP DIAGNOSTIC — remove after confirming build-time pool contention
  const start = Date.now();
  try {
    const remote = await fetchArtworks(init);
    // TEMP DIAGNOSTIC — remove after confirming build-time pool contention
    console.error(
      `[rad:diag] pid=${process.pid} GET /artworks ok ms=${Date.now() - start}`,
    );
    const list = Array.isArray(remote) ? remote : [];
    return {
      artworks: list.length
        ? mergeArtworks(list, fallbackArtworks)
        : fallbackArtworks,
      origin: "api",
    };
  } catch (error) {
    // TEMP DIAGNOSTIC — remove after confirming build-time pool contention
    console.error(
      `[rad:diag] pid=${process.pid} GET /artworks FAIL ms=${Date.now() - start}`,
    );
    if (source === "api") throw error;
    logRecovered("catalog", error);
    return { artworks: fallbackArtworks, origin: "registry" };
  }
}
