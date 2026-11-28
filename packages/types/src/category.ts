import type { LocalizedText } from "./artwork";

/** Active parent category returned to the storefront, with its active children. */
export interface PublicCategoryChild {
  id: string;
  slug: string;
  name: LocalizedText;
  sortOrder: number;
}

export interface PublicCategory {
  id: string;
  slug: string;
  name: LocalizedText;
  sortOrder: number;
  children: PublicCategoryChild[];
}

/** Admin view of one category or subcategory, including inactive rows and counts. */
export interface AdminCategory {
  id: string;
  slug: string;
  parentId: string | null;
  name: LocalizedText;
  active: boolean;
  sortOrder: number;
  /** Products whose stored category slug or subcategory id points at this row. */
  productCount: number;
  children: AdminCategory[];
}
