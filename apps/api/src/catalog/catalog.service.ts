import { Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Product } from "../database/entities";
import { InventoryService } from "../inventory/inventory.service";
import { pricedCatalogQuery } from "./catalog.query";
import { migrateProductImageStorage } from "./product-image-storage.migration";
import { stripImageSrc, toProduct } from "./product.mapper";

@Injectable()
export class CatalogService implements OnModuleInit {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly inventory: InventoryService,
  ) {}

  async onModuleInit() {
    // Same reasoning as OrdersService: a one-time backfill must not be able
    // to crash the whole API on a transient DB hiccup at boot. Log and move
    // on; it retries harmlessly on the next restart.
    try {
      await migrateProductImageStorage(this.dataSource, this.logger);
    } catch (error) {
      this.logger.warn(
        `ProductImage storage backfill skipped (will retry on next boot): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async list(category?: string) {
    await this.inventory.releaseExpiredHolds();
    const qb = pricedCatalogQuery(this.products);
    if (category && category !== "all") {
      qb.andWhere("product.category = :category", { category });
    }
    const products = await qb.getMany();
    return products.map((product) =>
      toProduct({ ...product, images: stripImageSrc(product.images ?? []) }),
    );
  }

  async bySlug(slug: string) {
    await this.inventory.releaseExpiredHolds();
    const product = await pricedCatalogQuery(this.products)
      .andWhere("product.slug = :slug", { slug })
      .getOne();
    if (!product || !this.inventory.isPublic(product.status)) {
      throw new NotFoundException("اثر پیدا نشد.");
    }
    return toProduct({
      ...product,
      images: stripImageSrc(product.images ?? []),
    });
  }

  async related(slug: string) {
    await this.inventory.releaseExpiredHolds();
    const products = await pricedCatalogQuery(this.products)
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
      return `${copy.name} ${copy.subtitle} ${copy.story} ${product.artworkNumber ?? ""}`
        .toLocaleLowerCase(locale)
        .includes(needle);
    });
  }
}
