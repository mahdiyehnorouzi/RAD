import type { Artwork } from "@rad/types";

function hasFileImage(artwork?: Artwork) {
  return Boolean(artwork?.images.some((image) => image.src?.startsWith("/")));
}

/**
 * The API owns every field. The registry only lends its static photography
 * (and editorial JSON if an older API omits it).
 */
export function mergeArtwork(live: Artwork, display?: Artwork): Artwork {
  if (!display) return live;
  return {
    ...live,
    images: hasFileImage(display) ? display.images : live.images,
    passport: live.passport ?? display.passport,
    difference: live.difference ?? display.difference,
  };
}

/** Once the API answers, only works it knows about exist. */
export function mergeArtworks(live: Artwork[], display: Artwork[]): Artwork[] {
  const bySlug = new Map(display.map((artwork) => [artwork.slug, artwork]));
  return live.map((artwork) => mergeArtwork(artwork, bySlug.get(artwork.slug)));
}
