import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, type SelectQueryBuilder } from "typeorm";
import { Product } from "../database/entities";
import { publicProductWhere, stripImageSrc, toProduct } from "./product.mapper";

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  async list(category?: string) {
    const qb = this.publicProductsQuery();
    if (category && category !== "all") {
      qb.andWhere("product.category = :category", { category });
    }
    const products = await qb.getMany();
    return products.map((product) =>
      toProduct({ ...product, images: stripImageSrc(product.images ?? []) }),
    );
  }

  async bySlug(slug: string) {
    const product = await this.publicProductsQuery()
      .andWhere("product.slug = :slug", { slug })
      .getOne();
    if (!product || product.status === "draft" || product.status === "review") {
      throw new NotFoundException("اثر پیدا نشد.");
    }
    return toProduct({ ...product, images: stripImageSrc(product.images ?? []) });
  }

  async related(slug: string) {
    const products = await this.publicProductsQuery()
      .andWhere("product.slug != :slug", { slug })
      .getMany();
    return products.map((product) =>
      toProduct({ ...product, images: stripImageSrc(product.images ?? []) }),
    );
  }

  async search(query: string, locale: "fa" | "en" = "fa") {
    const needle = query.trim().toLocaleLowerCase(locale);
    if (!needle) return [];
    const products = await this.list();
    return products.filter((product) => {
      const copy = locale === "en" ? product.en : product;
      return `${copy.name} ${copy.subtitle} ${copy.story}`
        .toLocaleLowerCase(locale)
        .includes(needle);
    });
  }

  /**
   * Public catalog loads image metadata only (never base64 `src`) and skips
   * rows that cannot be served by `/catalog/images/:id`.
   */
  private publicProductsQuery(): SelectQueryBuilder<Product> {
    return this.products
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.vendor", "vendor")
      .leftJoin(
        "product.images",
        "images",
        "images.src IS NOT NULL AND images.src LIKE :imagePrefix",
        { imagePrefix: "data:image/%" },
      )
      .addSelect([
        "images.id",
        "images.alt",
        "images.enAlt",
        "images.color",
        "images.accent",
        "images.shape",
        "images.sortOrder",
      ])
      .where("product.status NOT IN (:...hidden)", {
        hidden: publicProductWhere.status.notIn,
      })
      .orderBy("product.sortOrder", "ASC")
      .addOrderBy("images.sortOrder", "ASC");
  }
}
