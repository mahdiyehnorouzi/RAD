import type { Locale } from "@rad/types";

/** Approved sold-state sentence. The long “sold and never made again” line is not used. */
export const SOLD_STATUS_FA = "این رد صاحبش را پیدا کرده";

/**
 * Facts in the specifications card for a work with authored materials.
 * Making-process prose is intentionally absent — it belongs on the making path.
 */
export const ARTWORK_SPEC_FACT_KEYS = ["material", "surface", "size"] as const;

export type ArtworkSpecFactKey = (typeof ARTWORK_SPEC_FACT_KEYS)[number];

/** Title line keeps the archive number. The 1/1 mark stays on the edition fact, not here. */
export function titleIdentityLine(recordNumber: string | null): string | null {
  return recordNumber;
}

export function editionIdentity(
  recordNumber: string | null,
  oneOfOne: string,
): [string, string] | null {
  if (!recordNumber) return null;
  return [recordNumber, oneOfOne];
}

export function makingProcessText(
  process: { fa: string; en: string } | null | undefined,
  locale: Locale,
): string | undefined {
  const text = process?.[locale]?.trim();
  return text ? text : undefined;
}
