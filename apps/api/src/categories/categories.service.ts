import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { AdminCategory, PublicCategory } from "@rad/types";
import { Category, Product } from "../database/entities";
import { toAdminCategoryView, toPublicCategory } from "./categories.mapper";
import type { SaveCategoryDto } from "./dto/save-category.dto";
import type { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  async listPublic(): Promise<PublicCategory[]> {
    const rows = await this.ordered();
    const active = rows.filter((row) => row.active);
    return active
      .filter((row) => row.parentId === null)
      .map((parent) =>
        toPublicCategory(
          parent,
          active.filter((row) => row.parentId === parent.id),
        ),
      );
  }

  async listAdmin(): Promise<AdminCategory[]> {
    const rows = await this.ordered();
    const counts = await this.productCounts(rows);
    return rows
      .filter((row) => row.parentId === null)
      .map((parent) =>
        toAdminCategoryView(
          parent,
          counts.bySlug.get(parent.slug) ?? 0,
          rows
            .filter((row) => row.parentId === parent.id)
            .map((child) =>
              toAdminCategoryView(child, counts.byId.get(child.id) ?? 0),
            ),
        ),
      );
  }

  async create(input: SaveCategoryDto): Promise<AdminCategory> {
    const slug = input.slug.trim().toLowerCase();
    await this.assertSlugAvailable(slug);
    const parentId = await this.assertParent(input.parentId ?? null, null);
    const saved = await this.categories.save(
      this.categories.create({
        slug,
        parentId,
        name: { fa: input.name.fa.trim(), en: input.name.en.trim() },
        active: input.active ?? true,
        sortOrder: input.sortOrder ?? (await this.nextSortOrder(parentId)),
      }),
    );
    return toAdminCategoryView(saved, 0);
  }

  async update(id: string, input: UpdateCategoryDto): Promise<AdminCategory> {
    const current = await this.mustFind(id);
    const slug = input.slug?.trim().toLowerCase();
    if (slug && slug !== current.slug) {
      await this.assertSlugAvailable(slug);
      const usedAsParent = await this.products.count({
        where: { category: current.slug },
      });
      if (usedAsParent > 0) {
        throw new ConflictException({
          message: "این شناسه روی محصولات ثبت شده و قابل تغییر نیست.",
          code: "category_slug_in_use",
        });
      }
    }
    if (input.parentId !== undefined && input.parentId !== current.parentId) {
      if (input.parentId === current.id) {
        throw new BadRequestException({
          message: "دسته نمی‌تواند والد خودش باشد.",
          code: "category_self_parent",
        });
      }
      await this.assertCanReparent(current, input.parentId);
    }
    const parentId =
      input.parentId === undefined
        ? current.parentId
        : await this.assertParent(input.parentId, current.id);
    await this.categories.update(
      { id },
      {
        ...(slug ? { slug } : {}),
        ...(input.name
          ? { name: { fa: input.name.fa.trim(), en: input.name.en.trim() } }
          : {}),
        ...(input.sortOrder !== undefined
          ? { sortOrder: input.sortOrder }
          : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.parentId !== undefined ? { parentId } : {}),
      },
    );
    const saved = await this.mustFind(id);
    const counts = await this.productCounts([saved]);
    const productCount = saved.parentId
      ? (counts.byId.get(saved.id) ?? 0)
      : (counts.bySlug.get(saved.slug) ?? 0);
    return toAdminCategoryView(saved, productCount);
  }

  async remove(id: string) {
    const current = await this.mustFind(id);
    const [asParent, asChild, childCount] = await Promise.all([
      this.products.count({ where: { category: current.slug } }),
      this.products.count({ where: { subcategoryId: current.id } }),
      this.categories.count({ where: { parentId: current.id } }),
    ]);
    const productCount = asParent + asChild;
    if (productCount > 0 || childCount > 0) {
      throw new ConflictException({
        message: this.deleteBlockedMessage(productCount, childCount),
        code: "category_in_use",
      });
    }
    await this.categories.delete({ id });
    return { ok: true };
  }

  private async ordered() {
    return this.categories.find({
      order: { sortOrder: "ASC", slug: "ASC" },
    });
  }

  private async mustFind(id: string) {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) throw new NotFoundException("دسته‌بندی پیدا نشد.");
    return category;
  }

  private async assertSlugAvailable(slug: string) {
    const existing = await this.categories.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException({
        message: "این شناسه قبلاً استفاده شده است.",
        code: "category_slug_taken",
      });
    }
  }

  /** Returns a root parent id, or null when the row itself is a parent. */
  private async assertParent(parentId: string | null, selfId: string | null) {
    if (parentId === null) return null;
    if (selfId && parentId === selfId) {
      throw new BadRequestException({
        message: "دسته نمی‌تواند والد خودش باشد.",
        code: "category_self_parent",
      });
    }
    const parent = await this.categories.findOne({ where: { id: parentId } });
    if (!parent) {
      throw new BadRequestException({
        message: "دسته والد پیدا نشد.",
        code: "category_parent_missing",
      });
    }
    if (parent.parentId) {
      throw new BadRequestException({
        message: "زیردسته نمی‌تواند خودش زیردسته داشته باشد.",
        code: "category_depth",
      });
    }
    if (selfId) {
      const childCount = await this.categories.count({
        where: { parentId: selfId },
      });
      if (childCount > 0) {
        throw new BadRequestException({
          message: "زیردسته نمی‌تواند خودش زیردسته داشته باشد.",
          code: "category_depth",
        });
      }
    }
    return parent.id;
  }

  private async assertCanReparent(
    current: Category,
    nextParentId: string | null,
  ) {
    const subcategoryUse = await this.products.count({
      where: { subcategoryId: current.id },
    });
    if (subcategoryUse > 0) {
      throw new ConflictException({
        message: `این زیردسته روی ${subcategoryUse} محصول ثبت شده است. جابه‌جایی آن محصولات را عوض نمی‌کند و انجام نشد.`,
        code: "category_reparent_blocked",
      });
    }
    if (nextParentId !== null) {
      const asParent = await this.products.count({
        where: { category: current.slug },
      });
      if (asParent > 0) {
        throw new ConflictException({
          message: `این دسته روی ${asParent} محصول به‌عنوان دسته اصلی ثبت شده و جابه‌جا نمی‌شود.`,
          code: "category_reparent_blocked",
        });
      }
    }
  }

  private async nextSortOrder(parentId: string | null) {
    const row = await this.categories
      .createQueryBuilder("category")
      .select("MAX(category.sortOrder)", "max")
      .where(
        parentId
          ? "category.parentId = :parentId"
          : "category.parentId IS NULL",
        { parentId },
      )
      .getRawOne<{ max: string | number | null }>();
    if (row?.max == null) return 0;
    return Number(row.max) + 1;
  }

  private async productCounts(rows: Category[]) {
    const bySlug = new Map<string, number>();
    const byId = new Map<string, number>();
    if (!rows.length) return { bySlug, byId };
    const slugRows: Array<{ category: string; count: string }> =
      await this.products
        .createQueryBuilder("product")
        .select("product.category", "category")
        .addSelect("COUNT(*)", "count")
        .groupBy("product.category")
        .getRawMany();
    for (const row of slugRows) bySlug.set(row.category, Number(row.count));
    const idRows: Array<{ subcategoryId: string; count: string }> =
      await this.products
        .createQueryBuilder("product")
        .select("product.subcategoryId", "subcategoryId")
        .addSelect("COUNT(*)", "count")
        .where("product.subcategoryId IS NOT NULL")
        .groupBy("product.subcategoryId")
        .getRawMany();
    for (const row of idRows) byId.set(row.subcategoryId, Number(row.count));
    return { bySlug, byId };
  }

  private deleteBlockedMessage(productCount: number, childCount: number) {
    if (productCount > 0 && childCount > 0) {
      return `این دسته به ${productCount} محصول و ${childCount} زیردسته وصل است و حذف نمی‌شود. می‌توانید آن را غیرفعال کنید.`;
    }
    if (childCount > 0) {
      return `این دسته ${childCount} زیردسته دارد و حذف نمی‌شود.`;
    }
    return `این دسته روی ${productCount} محصول ثبت شده و قابل حذف نیست. آن را غیرفعال کنید.`;
  }
}
