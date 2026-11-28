import type { AdminCategory, PublicCategory } from "@rad/types";
import type { Category } from "../database/entities";

export function toPublicCategory(
  parent: Category,
  children: Category[],
): PublicCategory {
  return {
    id: parent.id,
    slug: parent.slug,
    name: parent.name,
    sortOrder: parent.sortOrder,
    children: children.map((child) => ({
      id: child.id,
      slug: child.slug,
      name: child.name,
      sortOrder: child.sortOrder,
    })),
  };
}

export function toAdminCategoryView(
  category: Category,
  productCount: number,
  children: AdminCategory[] = [],
): AdminCategory {
  return {
    id: category.id,
    slug: category.slug,
    parentId: category.parentId,
    name: category.name,
    active: category.active,
    sortOrder: category.sortOrder,
    productCount,
    children,
  };
}
