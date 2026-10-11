import "server-only";
import { cache } from "react";
import type { Artwork, Product } from "@rad/types";
import { shopProducts } from "@/lib/artworks";
import {
  fallbackArtworks,
  loadArtworks,
  type ArtworksOrigin,
} from "@/lib/artworks/server";
import type { CatalogIndexEntry } from "./catalog-index";
import { CATALOG_TAG } from "./catalog-tag";

type CatalogLoad = {
  artworks: Artwork[];
  /** The shop projection of `artworks`. */
  products: Product[];
  /** `registry` when the API was skipped or unreachable; see CATALOG_SOURCE. */
  origin: ArtworksOrigin;
};

/** Registry shop works, for build-time static params only; pages render {@link getCatalog}. */
export function registryProducts(): Product[] {
  return shopProducts(fallbackArtworks);
}

const CATALOG_PROCESS_CACHE_MS = 30_000;

/**
 * Module-scope (one per worker process), not React's `cache()`: that cache is
 * reset per request/render, so without this a `next build` static-generation
 * worker that renders many pages still issues one GET /artworks per page. This
 * singleton is shared by every page that worker renders for
 * `CATALOG_PROCESS_CACHE_MS`, matching the underlying fetch's own
 * `revalidate: 30`. `refreshCatalog` clears it alongside the tag so a
 * mutation is visible immediately instead of waiting out the window.
 */
let processCatalogCache: { value: Promise<CatalogLoad>; expiresAt: number } | null = null;

function loadCatalogForProcess(): Promise<CatalogLoad> {
  const now = Date.now();
  if (processCatalogCache && processCatalogCache.expiresAt > now) {
    return processCatalogCache.value;
  }
  const value = (async (): Promise<CatalogLoad> => {
    const { artworks, origin } = await loadArtworks({
      next: { revalidate: 30, tags: [CATALOG_TAG] },
      timeoutMs: 8_000,
    });
    return { artworks, products: shopProducts(artworks), origin };
  })();
  processCatalogCache = { value, expiresAt: now + CATALOG_PROCESS_CACHE_MS };
  // Don't cache a rejection: let the next caller retry instead of failing
  // every request for the rest of the window.
  value.catch(() => {
    if (processCatalogCache?.value === value) processCatalogCache = null;
  });
  return value;
}

/** Drops the in-process catalog cache; call alongside `updateTag(CATALOG_TAG)`. */
export function resetProcessCatalogCache() {
  processCatalogCache = null;
}

/**
 * The public catalog, shared by every request for 30 seconds and deduplicated
 * within a render. Purchases and bag changes expire it through `refreshCatalog`.
 */
export const getCatalog = cache(loadCatalogForProcess);

// TEMP DIAGNOSTIC — remove after identifying catalog-fetch caller distribution
//
// Logs every call reaching the catalog-fetch path, labeled by caller, and
// whether the module-scope `processCatalogCache` singleton was already warm
// (cacheHit) or about to trigger `loadArtworks()`/a live fetch (cacheHit=false).
// Checked synchronously *before* `getCatalog()`/`getCatalogIndex()` actually
// runs, so it reflects the singleton's state at the moment of the call.
// Call this at every call site instead of modifying `getCatalog`'s signature —
// `getCatalog` is wrapped in React's `cache()`, which keys its memoization by
// arguments, so giving it a `caller` parameter would fragment that per-request
// dedup instead of just labeling it.
export function traceCatalogCall(caller: string) {
  const hit = Boolean(processCatalogCache && processCatalogCache.expiresAt > Date.now());
  console.error(
    `[rad:diag:caller] pid=${process.pid} caller=${caller} cacheHit=${hit} ts=${Date.now()}`,
  );
}

/** Names and numbers only: enough for breadcrumbs, toasts and notices on every page. */
export const getCatalogIndex = cache(async (): Promise<CatalogIndexEntry[]> => {
  const { artworks, products } = await getCatalog();
  const inShop = new Set(products.map((product) => product.slug));
  return artworks.map((artwork) => ({
    slug: artwork.slug,
    radNumber: artwork.radNumber ?? undefined,
    category: artwork.category,
    title: artwork.title,
    inShop: inShop.has(artwork.slug),
    hasDifference: Boolean(artwork.difference),
  }));
});
