import type { MessageKey } from "@/i18n/fa";
import { CATALOG_SORTS, type CatalogSort } from "@/lib/catalog/filters";

const sortLabelKey: Record<CatalogSort, MessageKey> = {
  newest: "sortNewest",
  oldest: "sortOldest",
  "price-asc": "sortPriceAsc",
  "price-desc": "sortPriceDesc",
};

export const sortOptions = CATALOG_SORTS.map((id) => ({
  id,
  labelKey: sortLabelKey[id],
}));
