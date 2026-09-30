import {
  parseRadNumber,
  type LocalizedText,
  type ProductCategory,
} from "@rad/types";

export type CatalogIndexEntry = {
  slug: string;
  radNumber?: number;
  category: ProductCategory;
  title: LocalizedText;
  /** Has a product page (offered in the shop). */
  inShop: boolean;
  /** Has a Museum of Differences page. */
  hasDifference: boolean;
};

/** `key` is a RAD number (`41`, `041`, `RAD / 041`) or a slug. */
export function findIndexEntry(
  entries: CatalogIndexEntry[],
  key: string | number | null | undefined,
) {
  const raw = decodeURIComponent(String(key ?? "")).trim();
  if (!raw) return undefined;
  const bySlug = entries.find((entry) => entry.slug === raw);
  if (bySlug) return bySlug;
  if (!/^(rad[\s/-]*)?\d+$/i.test(raw)) return undefined;
  const radNumber = parseRadNumber(raw);
  return radNumber
    ? entries.find((entry) => entry.radNumber === radNumber)
    : undefined;
}
