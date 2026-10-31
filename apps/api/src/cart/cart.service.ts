import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CartItem, Order, Product } from "../database/entities";
import { IdentityService } from "../common/identity.service";
import { InventoryService } from "../inventory/inventory.service";
import type { Actor } from "../common/identity";
import type { CartPendingOrder, CartSnapshot } from "./type";

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
    await this.inventory.releaseExpiredHolds();
    await this.cartItems.manager.transaction(async (manager) => {
      // The product lock serializes simultaneous adds of this one-of-one work.
      // Saving the cart row in the same transaction also rolls back the hold
      // if persistence fails.
      await this.inventory.hold(ownerKey, slug, manager);
      const items = manager.getRepository(CartItem);
      const existing = await items.findOne({
        where: { ownerKey, productSlug: slug },
      });
      if (!existing) {
        const product = await manager.getRepository(Product).findOneOrFail({
          where: { slug },
          select: { id: true, tomanPrice: true, usdPrice: true },
        });
        await items.save(
          items.create({
            ownerKey,
            productSlug: slug,
            tomanPriceAtAdd: product.tomanPrice,
            usdPriceAtAdd: product.usdPrice,
          }),
        );
      }
    });
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
      pendingOrders: await this.pendingOrders(ownerKey),
    };
  }

  /**
   * Checkout deletes the bag and keeps the works on the order. The bag
   * response still names those orders so the shop can resume payment
   * instead of looking empty.
   */
  private async pendingOrders(ownerKey: string): Promise<CartPendingOrder[]> {
    const now = Date.now();
    const orders = await this.cartItems.manager.getRepository(Order).find({
      where: { ownerKey, status: "pending_payment" },
      relations: { items: true },
      order: { createdAt: "ASC" },
    });
    return orders
      .filter(
        (order) => !order.paymentDueAt || order.paymentDueAt.getTime() > now,
      )
      .map((order) => ({
        id: order.id,
        status: "pending_payment" as const,
        paymentDueAt: order.paymentDueAt?.getTime() ?? null,
        slugs: (order.items ?? []).map((item) => item.productSlug),
      }));
  }
}
