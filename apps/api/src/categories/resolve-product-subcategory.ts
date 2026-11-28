import { BadRequestException } from "@nestjs/common";
import type { Repository } from "typeorm";
import { Category } from "../database/entities";

/**
 * Resolves an optional subcategory on product save.
 *
 * `undefined` keeps the stored value after checking it still belongs to
 * the selected parent. `null` or a blank string clears it. A slug must be
 * a child of the category that was just resolved for the product.
 */
export async function resolveProductSubcategory(
  categories: Repository<Category>,
  input: {
    storeCategory: string;
    subcategory: string | null | undefined;
    existingSubcategoryId: string | null;
  },
): Promise<string | null | undefined> {
  if (input.subcategory === undefined) {
    if (!input.existingSubcategoryId) return undefined;
    const current = await categories.findOne({
      where: { id: input.existingSubcategoryId },
      relations: { parent: true },
    });
    if (!current?.parent || current.parent.slug !== input.storeCategory) {
      throw new BadRequestException({
        message:
          "زیردسته با دسته‌بندی انتخاب‌شده هم‌خوان نیست. زیردسته را عوض کنید یا خالی بفرستید.",
        code: "subcategory_parent_mismatch",
      });
    }
    return undefined;
  }

  const slug = input.subcategory?.trim() ?? "";
  if (!slug) return null;

  const child = await categories.findOne({
    where: { slug },
    relations: { parent: true },
  });
  if (!child?.parent) {
    throw new BadRequestException({
      message: "زیردسته پیدا نشد.",
      code: "subcategory_invalid",
    });
  }
  if (child.parent.slug !== input.storeCategory) {
    throw new BadRequestException({
      message: "زیردسته به این دسته‌بندی تعلق ندارد.",
      code: "subcategory_parent_mismatch",
    });
  }
  return child.id;
}
