/** Approved sold-state sentence. The long “sold and never made again” line is not used. */
export const SOLD_STATUS_FA = "این رد صاحبش را پیدا کرده";

/**
 * Facts in the specifications card for a work with authored materials.
 * Product description and making-path prose are not specification rows.
 */
export const ARTWORK_SPEC_FACT_KEYS = ["material", "surface", "size"] as const;

/** Title line keeps the archive number. The 1/1 mark is not part of it. */
export function titleIdentityLine(recordNumber: string | null): string | null {
  return recordNumber;
}

/** Archive identifier alone, for example `RĀD / ۰۸۲`. */
export function editionIdentity(recordNumber: string | null): string | null {
  const value = recordNumber?.trim();
  return value ? value : null;
}

/**
 * True when a specification value is the product description or story,
 * including a longer body that begins with the stored subtitle.
 */
export function isArtworkDescriptionCopy(
  value: string | null | undefined,
  description: string | null | undefined,
  story: string | null | undefined,
): boolean {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) return false;
  return [description, story].some((source) => {
    const prose = source?.replace(/\s+/g, " ").trim();
    if (!prose) return false;
    return text === prose || text.startsWith(prose);
  });
}
