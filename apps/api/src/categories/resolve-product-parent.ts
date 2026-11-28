import { BadRequestException } from "@nestjs/common";
import { IsNull, type Repository } from "typeorm";
import { ADMIN_CATEGORIES, toStoreCategory } from "../catalog/category";
import { Category } from "../database/entities";

/**
 * Resolves the parent category stored on a product.
 *
 * A category slug wins when that parent row exists. A legacy Persian admin
 * label still maps through the old list so existing clients keep working.
 * Anything else is rejected. Unknown labels are not collapsed to ceramics.
 */
export async function resolveProductParentSlug(
  categories: Repository<Category>,
  value: string,
) {
  const trimmed = value.trim();
  const direct = await categories.findOne({
    where: { slug: trimmed, parentId: IsNull() },
  });
  if (direct) return direct.slug;
  if ((ADMIN_CATEGORIES as readonly string[]).includes(trimmed)) {
    return toStoreCategory(trimmed);
  }
  throw new BadRequestException({
    message: "دسته‌بندی پیدا نشد.",
    code: "category_invalid",
  });
}
