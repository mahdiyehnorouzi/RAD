import type { Artwork, ProductImage } from "@rad/types";

function hasUsableMedia(items?: ProductImage[]) {
  return Boolean(items?.some((item) => Boolean(item.src)));
}

/**
 * The API owns every field, including photography — it's the only side
 * that knows about admin-uploaded media (SeaweedFS, Cloudinary, legacy
 * base64, external URLs). The registry's bundled photography is a fallback
 * for when the API has nothing real to show yet (and lends editorial JSON
 * if an older API omits it).
 */
export function mergeArtwork(live: Artwork, display?: Artwork): Artwork {
  if (!display) return live;
  return {
    ...live,
    images: hasUsableMedia(live.images) ? live.images : display.images,
    media: hasUsableMedia(live.media) ? live.media : display.media,
    passport: live.passport ?? display.passport,
    difference: live.difference ?? display.difference,
  };
}

/** Once the API answers, only works it knows about exist. */
export function mergeArtworks(live: Artwork[], display: Artwork[]): Artwork[] {
  const bySlug = new Map(display.map((artwork) => [artwork.slug, artwork]));
  return live.map((artwork) => mergeArtwork(artwork, bySlug.get(artwork.slug)));
}
