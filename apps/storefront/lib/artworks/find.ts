import { parseRadNumber, type Artwork } from "@rad/types";

/** `key` is a RAD number (`41`, `041`, `RAD / 041`) or a slug. */
export function findArtwork(
  artworks: Artwork[],
  key: string | number | null | undefined,
) {
  const raw = decodeURIComponent(String(key ?? "")).trim();
  if (!raw) return undefined;
  const bySlug = artworks.find((artwork) => artwork.slug === raw);
  if (bySlug) return bySlug;
  if (!/^(rad[\s/-]*)?\d+$/i.test(raw)) return undefined;
  const radNumber = parseRadNumber(raw);
  return radNumber
    ? artworks.find((artwork) => artwork.radNumber === radNumber)
    : undefined;
}
