import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "../database/entities";
import { InventoryService } from "../inventory/inventory.service";
import { ProductAttributesService } from "../product-attributes/product-attributes.service";
import { toArtwork } from "./artwork.mapper";
import { publicCatalogQuery } from "./catalog.query";
import { stripImageSrc } from "./product.mapper";

@Injectable()
export class ArtworksService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly inventory: InventoryService,
    private readonly productAttributes: ProductAttributesService,
  ) {}

  /**
   * Read-only: does not call `releaseExpiredHolds()`. Expired holds are
   * released by `InventoryService`'s periodic sweep (`HOLD_SWEEP_INTERVAL_MS`,
   * every 30s) and by every write path that actually mutates availability
   * (cart hold, checkout, admin review). A listing read may lag an expiry by
   * up to one sweep interval; that is a staleness tradeoff, not a correctness
   * one — the real-time guard against overselling is the pessimistic lock in
   * `OrdersService.checkout`, which this method never touches.
   */
  async list() {
    const rows = await publicCatalogQuery(this.products).getMany();
    const attributesByProduct =
      await this.productAttributes.displayAttributesForProducts(
        rows.map((row) => ({ id: row.id, category: row.category })),
      );
    return rows.map((row) =>
      toArtwork(
        { ...row, images: stripImageSrc(row.images ?? []) },
        attributesByProduct.get(row.id) ?? [],
      ),
    );
  }

  /** `key` is a RAD number (`41`, `041`, `RAD-041`) or a slug. */
  async byKey(key: string) {
    await this.inventory.releaseExpiredHolds();
    const qb = publicCatalogQuery(this.products);
    const digits = /^(rad[-\s/]*)?\d+$/i.test(key.trim())
      ? Number(key.replace(/\D/g, ""))
      : null;
    if (digits)
      qb.andWhere("product.radNumber = :radNumber", { radNumber: digits });
    else qb.andWhere("product.slug = :slug", { slug: key });
    const row = await qb.getOne();
    if (!row) throw new NotFoundException("اثر پیدا نشد.");
    const attributesByProduct =
      await this.productAttributes.displayAttributesForProducts([
        { id: row.id, category: row.category },
      ]);
    return toArtwork(
      { ...row, images: stripImageSrc(row.images ?? []) },
      attributesByProduct.get(row.id) ?? [],
    );
  }
}
