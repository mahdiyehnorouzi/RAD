import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";
import {
  ProductAttribute,
  ProductAttributeCategory,
  ProductAttributeOption,
  ProductAttributeValue,
} from "../database/entities";
import { toStoreCategory } from "../catalog/category";
import type { SaveProductAttributeDto } from "./dto";
import {
  coerceAttributeValue,
  formatAttributeDisplayValue,
  toProductAttributeView,
} from "./product-attributes.mapper";
import type { ProductAttributeDisplayValue, ProductAttributeView } from "./type";

const attributeRelations = { options: true, categoryLinks: true } as const;

@Injectable()
export class ProductAttributesService {
  constructor(
    @InjectRepository(ProductAttribute)
    private readonly attributes: Repository<ProductAttribute>,
    @InjectRepository(ProductAttributeOption)
    private readonly options: Repository<ProductAttributeOption>,
    @InjectRepository(ProductAttributeCategory)
    private readonly categoryLinks: Repository<ProductAttributeCategory>,
    @InjectRepository(ProductAttributeValue)
    private readonly values: Repository<ProductAttributeValue>,
  ) {}

  async list(): Promise<ProductAttributeView[]> {
    const rows = await this.attributes.find({
      relations: attributeRelations,
      order: { sortOrder: "ASC", createdAt: "ASC" },
    });
    return rows.map(toProductAttributeView);
  }

  /** Active attributes assigned to one admin category label, in display order. */
  async byCategory(adminCategoryLabel: string): Promise<ProductAttributeView[]> {
    const storeCategory = toStoreCategory(adminCategoryLabel);
    const rows = await this.attributes
      .createQueryBuilder("attribute")
      .leftJoinAndSelect("attribute.options", "options")
      .leftJoinAndSelect("attribute.categoryLinks", "categoryLinks")
      .where("attribute.active = true")
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select("1")
          .from(ProductAttributeCategory, "link")
          .where("link.attributeId = attribute.id")
          .andWhere("link.category = :storeCategory")
          .getQuery();
        return `EXISTS (${sub})`;
      })
      .setParameter("storeCategory", storeCategory)
      .orderBy("attribute.sortOrder", "ASC")
      .getMany();
    return rows.map(toProductAttributeView);
  }

  private async assertUniqueKey(key: string, excludeId?: string) {
    const existing = await this.attributes.findOne({ where: { key } });
    if (existing && existing.id !== excludeId)
      throw new ConflictException("کلید ویژگی تکراری است.");
  }

  private assertUniqueOptionValues(options: SaveProductAttributeDto["options"]) {
    const values = (options ?? []).map((option) => option.value);
    if (values.length !== new Set(values).size)
      throw new BadRequestException("کلید گزینه‌ها باید یکتا باشد.");
  }

  private requiresOptions(inputType: SaveProductAttributeDto["inputType"]) {
    return inputType === "select" || inputType === "multiselect";
  }

  async create(input: SaveProductAttributeDto): Promise<ProductAttributeView> {
    await this.assertUniqueKey(input.key);
    this.assertUniqueOptionValues(input.options);
    if (this.requiresOptions(input.inputType) && !input.options?.length)
      throw new BadRequestException(
        "ویژگی‌های تک‌انتخابی و چندانتخابی به دست‌کم یک گزینه نیاز دارند.",
      );

    const saved = await this.attributes.manager.transaction(async (manager) => {
      const attribute = await manager.save(
        manager.create(ProductAttribute, {
          key: input.key.trim(),
          label: input.label.trim(),
          inputType: input.inputType,
          unit: input.unit?.trim() || null,
          required: input.required,
          active: input.active,
          sortOrder: input.sortOrder ?? (await this.nextSortOrder()),
        }),
      );
      await this.writeOptionsAndCategories(manager, attribute.id, input);
      return attribute;
    });
    return this.getFullOrFail(saved.id);
  }

  async update(
    id: string,
    input: SaveProductAttributeDto,
  ): Promise<ProductAttributeView> {
    const current = await this.attributes.findOne({ where: { id } });
    if (!current) throw new NotFoundException("ویژگی پیدا نشد.");
    await this.assertUniqueKey(input.key, id);
    this.assertUniqueOptionValues(input.options);
    if (this.requiresOptions(input.inputType) && !input.options?.length)
      throw new BadRequestException(
        "ویژگی‌های تک‌انتخابی و چندانتخابی به دست‌کم یک گزینه نیاز دارند.",
      );

    await this.attributes.manager.transaction(async (manager) => {
      await manager.update(ProductAttribute, { id }, {
        key: input.key.trim(),
        label: input.label.trim(),
        inputType: input.inputType,
        unit: input.unit?.trim() || null,
        required: input.required,
        active: input.active,
        sortOrder: input.sortOrder ?? current.sortOrder,
      });
      // Options/categories are replaced wholesale on every save — simpler
      // than diffing, and safe because a product's stored value keeps the
      // option's stable `value` string, never the option row's db id.
      await manager.delete(ProductAttributeOption, { attributeId: id });
      await manager.delete(ProductAttributeCategory, { attributeId: id });
      await this.writeOptionsAndCategories(manager, id, input);
    });
    return this.getFullOrFail(id);
  }

  private async writeOptionsAndCategories(
    manager: EntityManager,
    attributeId: string,
    input: SaveProductAttributeDto,
  ) {
    const options = (input.options ?? []).map((option, index) =>
      manager.create(ProductAttributeOption, {
        attributeId,
        value: option.value.trim(),
        label: option.label.trim(),
        sortOrder: option.sortOrder ?? index,
      }),
    );
    if (options.length) await manager.save(options);

    const storeCategories = [...new Set(input.categories.map(toStoreCategory))];
    const links = storeCategories.map((category) =>
      manager.create(ProductAttributeCategory, { attributeId, category }),
    );
    if (links.length) await manager.save(links);
  }

  private async nextSortOrder() {
    const last = await this.attributes.findOne({
      where: {},
      order: { sortOrder: "DESC" },
    });
    return (last?.sortOrder ?? -1) + 1;
  }

  async remove(id: string) {
    const attribute = await this.attributes.findOne({ where: { id } });
    if (!attribute) throw new NotFoundException("ویژگی پیدا نشد.");
    const inUse = await this.values.count({ where: { attributeId: id } });
    if (inUse > 0)
      throw new ConflictException(
        "این ویژگی برای محصولاتی ثبت شده و قابل حذف نیست؛ آن را غیرفعال کنید.",
      );
    await this.attributes.delete({ id });
    return { ok: true };
  }

  async reorder(ids: string[]) {
    await this.attributes.manager.transaction(async (manager) => {
      for (const [sortOrder, id] of ids.entries()) {
        await manager.update(ProductAttribute, { id }, { sortOrder });
      }
    });
    return this.list();
  }

  private async getFullOrFail(id: string) {
    const attribute = await this.attributes.findOne({
      where: { id },
      relations: attributeRelations,
    });
    if (!attribute) throw new NotFoundException("ویژگی پیدا نشد.");
    return toProductAttributeView(attribute);
  }

  /**
   * Validates `rawValues` (keyed by attribute id) against every attribute
   * currently assigned to `storeCategory` (required-ness) and against the
   * live definition of every attribute a value was actually submitted for
   * (type/options), then upserts. Values for attributes outside the
   * product's current category — or not submitted at all — are left
   * untouched: never silently deleted, per a category change or a partial
   * save.
   */
  async saveValuesForProduct(
    productId: string,
    storeCategory: string,
    rawValues: Record<string, unknown> | undefined,
  ) {
    const values = rawValues ?? {};
    const all = await this.attributes.find({ relations: attributeRelations });
    const byId = new Map(all.map((attribute) => [attribute.id, attribute]));

    const requiredForCategory = all.filter(
      (attribute) =>
        attribute.active &&
        attribute.required &&
        attribute.categoryLinks.some((link) => link.category === storeCategory),
    );
    for (const attribute of requiredForCategory) {
      const provided = values[attribute.id];
      const empty =
        provided === undefined ||
        provided === null ||
        provided === "" ||
        (Array.isArray(provided) && provided.length === 0);
      if (empty)
        throw new BadRequestException(`ویژگی «${attribute.label}» الزامی است.`);
    }

    const entries = Object.entries(values).filter(([attributeId]) =>
      byId.has(attributeId),
    );
    if (!entries.length) return;

    await this.values.manager.transaction(async (manager) => {
      for (const [attributeId, raw] of entries) {
        const attribute = byId.get(attributeId)!;
        const coerced = coerceAttributeValue(attribute, raw);
        const existing = await manager.findOne(ProductAttributeValue, {
          where: { productId, attributeId },
        });
        if (existing) {
          await manager.update(ProductAttributeValue, { id: existing.id }, {
            value: coerced,
          });
        } else {
          await manager.save(
            manager.create(ProductAttributeValue, {
              productId,
              attributeId,
              value: coerced,
            }),
          );
        }
      }
    });
  }

  /** Raw stored values for one product, keyed by attribute id — for the admin edit form. */
  async valuesForProduct(productId: string): Promise<Record<string, unknown>> {
    const [byProduct] = await this.valuesForProducts([productId]);
    return byProduct?.[1] ?? {};
  }

  /** Raw stored values for several products, keyed by attribute id — for the admin list/edit views. */
  async valuesForProducts(
    productIds: string[],
  ): Promise<[string, Record<string, unknown>][]> {
    if (!productIds.length) return [];
    const rows = await this.values.find({ where: { productId: In(productIds) } });
    const byProduct = new Map<string, Record<string, unknown>>(
      productIds.map((id) => [id, {}]),
    );
    for (const row of rows) {
      byProduct.get(row.productId)![row.attributeId] = row.value;
    }
    return [...byProduct.entries()];
  }

  /**
   * Formatted, display-ready attributes for each product, filtered to
   * active attributes currently assigned to that product's own category —
   * a stored value for an attribute no longer tied to the category stays
   * in the database (see `saveValuesForProduct`) but is not shown.
   */
  async displayAttributesForProducts(
    products: { id: string; category: string }[],
  ): Promise<Map<string, ProductAttributeDisplayValue[]>> {
    const result = new Map<string, ProductAttributeDisplayValue[]>();
    if (!products.length) return result;
    const productIds = products.map((product) => product.id);
    const categoryById = new Map(products.map((p) => [p.id, p.category]));

    const [rows, attributes] = await Promise.all([
      this.values.find({ where: { productId: In(productIds) } }),
      this.attributes.find({ relations: attributeRelations }),
    ]);
    const attributeById = new Map(attributes.map((a) => [a.id, a]));

    const byProduct = new Map<string, typeof rows>();
    for (const row of rows) {
      byProduct.set(row.productId, [...(byProduct.get(row.productId) ?? []), row]);
    }

    for (const productId of productIds) {
      const category = categoryById.get(productId)!;
      const rowsForProduct = byProduct.get(productId) ?? [];
      const display = rowsForProduct
        .map((row) => {
          const attribute = attributeById.get(row.attributeId);
          if (
            !attribute ||
            !attribute.active ||
            !attribute.categoryLinks.some((link) => link.category === category)
          )
            return null;
          return {
            sortOrder: attribute.sortOrder,
            display: formatAttributeDisplayValue(attribute, row.value),
          };
        })
        .filter(
          (entry): entry is { sortOrder: number; display: ProductAttributeDisplayValue } =>
            Boolean(entry?.display),
        )
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((entry) => entry.display);
      result.set(productId, display);
    }
    return result;
  }
}
