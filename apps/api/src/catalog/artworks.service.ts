import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "../database/entities";
import { InventoryService } from "../inventory/inventory.service";
import { toArtwork } from "./artwork.mapper";
import { publicCatalogQuery } from "./catalog.query";
import { stripImageSrc } from "./product.mapper";

@Injectable()
export class ArtworksService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly inventory: InventoryService,
  ) {}

  async list() {
    await this.inventory.releaseExpiredHolds();
    const rows = await publicCatalogQuery(this.products).getMany();
    return rows.map((row) =>
      toArtwork({ ...row, images: stripImageSrc(row.images ?? []) }),
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
    return toArtwork({ ...row, images: stripImageSrc(row.images ?? []) });
  }
}
