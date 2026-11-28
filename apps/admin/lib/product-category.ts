import type { AdminCategory } from "@rad/types";
import type { AdminProduct } from "./admin-data";

const LEGACY_PARENT_SLUG: Record<string, string> = {
  گلدان: "ceramics",
  ظروف: "ceramics",
  "سفال و سرامیک": "ceramics",
  مجسمه: "sculpture",
  نقاشی: "painting",
  "پارچه و بافت": "textile",
  "آثار چوبی": "woodwork",
  "زیورآلات هنری": "jewelry",
  "چاپ دستی و تصویر": "print",
};

export function parentsOf(categories: AdminCategory[]) {
  return categories
    .filter((category) => category.parentId == null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug));
}

export function parentSlugForProduct(
  product: Pick<AdminProduct, "category" | "categorySlug">,
  categories: AdminCategory[],
) {
  const parents = parentsOf(categories);
  if (
    product.categorySlug &&
    parents.some((item) => item.slug === product.categorySlug)
  ) {
    return product.categorySlug;
  }
  const byName = parents.find((item) => item.name.fa === product.category);
  if (byName) return byName.slug;
  const legacy = LEGACY_PARENT_SLUG[product.category];
  if (legacy && parents.some((item) => item.slug === legacy)) return legacy;
  return product.categorySlug ?? "";
}

export function childrenOf(parentSlug: string, categories: AdminCategory[]) {
  const parent = parentsOf(categories).find((item) => item.slug === parentSlug);
  return [...(parent?.children ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug),
  );
}

/** Keeps a subcategory only when it belongs to the selected parent. */
export function keptSubcategory(
  parentSlug: string,
  subcategory: string | null | undefined,
  categories: AdminCategory[],
) {
  if (!subcategory) return null;
  return childrenOf(parentSlug, categories).some(
    (item) => item.slug === subcategory,
  )
    ? subcategory
    : null;
}

/**
 * Selects the parent slug for the form. The stored subcategory is left
 * as it was; it is cleared only when the parent selection changes.
 */
export function alignProductCategory(
  product: AdminProduct,
  categories: AdminCategory[],
  isNew: boolean,
): AdminProduct {
  const parents = parentsOf(categories);
  let slug = parentSlugForProduct(product, categories);
  if (!slug && isNew) {
    slug = parents.find((item) => item.active)?.slug ?? parents[0]?.slug ?? "";
  }
  const parent = parents.find((item) => item.slug === slug);
  return {
    ...product,
    categorySlug: slug || product.categorySlug,
    category: parent?.name.fa ?? product.category,
    subcategory: product.subcategory ?? null,
  };
}
