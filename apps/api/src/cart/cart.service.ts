import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CartItem, Product } from "../database/entities";
import { IdentityService } from "../common/identity.service";
import { InventoryService } from "../inventory/inventory.service";
import type { Actor } from "../common/identity";
import type { CartSnapshot } from "./type";

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItems: Repository<CartItem>,
    private readonly identity: IdentityService,
    private readonly inventory: InventoryService,
  ) {}

  async get(actor: Actor) {
    await this.inventory.releaseExpiredHolds();
    return this.snapshot(this.identity.key(actor));
  }

  async add(actor: Actor, slug: string) {
    const ownerKey = this.identity.key(actor);
    await this.inventory.hold(ownerKey, slug);
    const existing = await this.cartItems.findOne({
      where: { ownerKey, productSlug: slug },
    });
    if (!existing) {
      const product = await this.cartItems.manager
        .getRepository(Product)
        .findOne({
          where: { slug },
          select: { id: true, tomanPrice: true, usdPrice: true },
        });
      await this.cartItems.save(
        this.cartItems.create({
          ownerKey,
          productSlug: slug,
          tomanPriceAtAdd: product?.tomanPrice ?? null,
          usdPriceAtAdd: product?.usdPrice ?? null,
        }),
      );
    }
    return this.snapshot(ownerKey);
  }

  async remove(actor: Actor, slug: string) {
    const ownerKey = this.identity.key(actor);
    await this.cartItems.manager.transaction(async (manager) => {
      await manager
        .getRepository(CartItem)
        .delete({ ownerKey, productSlug: slug });
      await this.inventory.releaseCartHolds(ownerKey, [slug], manager);
    });
    return this.snapshot(ownerKey);
  }

  async clear(actor: Actor) {
    const ownerKey = this.identity.key(actor);
    await this.cartItems.manager.transaction(async (manager) => {
      const items = await manager.getRepository(CartItem).find({
        where: { ownerKey },
        select: { id: true, productSlug: true },
      });
      await manager.getRepository(CartItem).delete({ ownerKey });
      await this.inventory.releaseCartHolds(
        ownerKey,
        items.map((item) => item.productSlug),
        manager,
      );
    });
    return this.snapshot(ownerKey);
  }

  private async snapshot(ownerKey: string): Promise<CartSnapshot> {
    const items = await this.cartItems.find({
      where: { ownerKey },
      select: {
        id: true,
        productSlug: true,
        tomanPriceAtAdd: true,
        usdPriceAtAdd: true,
      },
      order: { createdAt: "ASC" },
    });
    const slugs = items.map((item) => item.productSlug);
    const prices: CartSnapshot["prices"] = {};
    for (const item of items) {
      if (item.tomanPriceAtAdd !== null && item.usdPriceAtAdd !== null) {
        prices[item.productSlug] = {
          toman: item.tomanPriceAtAdd,
          usd: item.usdPriceAtAdd,
        };
      }
    }
    return {
      slugs,
      holds: await this.inventory.holdsFor(ownerKey, slugs),
      prices,
    };
  }
}
