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
    // TEMP DIAGNOSTIC — remove after confirming build-time pool contention
    const pool = (this.products.manager.connection.driver as unknown as {
      master?: { totalCount: number; idleCount: number; waitingCount: number };
    }).master;
    const start = process.hrtime.bigint();
    console.error(
      `[rad:diag:api] pid=${process.pid} ts=${Date.now()} artworks.list start pool(max=5) total=${pool?.totalCount} idle=${pool?.idleCount} waiting=${pool?.waitingCount}`,
    );
    const rows = await publicCatalogQuery(this.products).getMany();
    const result = rows.map((row) =>
      toArtwork({ ...row, images: stripImageSrc(row.images ?? []) }),
    );
    // TEMP DIAGNOSTIC — remove after confirming build-time pool contention
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.error(
      `[rad:diag:api] pid=${process.pid} ts=${Date.now()} artworks.list done ms=${ms.toFixed(1)} rows=${result.length}`,
    );
    return result;
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
