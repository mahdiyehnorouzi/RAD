import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { DataSource, In, IsNull, Not, type EntityManager } from "typeorm";
import {
  CartItem,
  Order,
  OrderItem,
  PaymentIntent,
  Product,
} from "../database/entities";
import {
  CART_HOLD_MS,
  HIDDEN_PRODUCT_STATUSES,
  HOLD_SWEEP_INTERVAL_MS,
  LEGACY_PRODUCT_STATUS,
} from "./const/product-status";
import {
  canTransitionProductStatus,
  normalizeProductStatus,
} from "./product-status";
import type { ProductStatus } from "./type";

/**
 * Owns every write to `Product.status`. Adding to a cart holds the work as
 * `sold` for {@link CART_HOLD_MS}; unpaid holds are swept back to `available`.
 */
@Injectable()
export class InventoryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InventoryService.name);
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.migrateLegacyStatuses();
    this.sweepTimer = setInterval(() => {
      this.releaseExpiredHolds().catch((error) =>
        this.logger.warn(
          `Hold sweep failed: ${error instanceof Error ? error.message : error}`,
        ),
      );
    }, HOLD_SWEEP_INTERVAL_MS);
    this.sweepTimer.unref();
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  isPublic(status: string) {
    return !(HIDDEN_PRODUCT_STATUSES as readonly string[]).includes(
      normalizeProductStatus(status),
    );
  }

  /**
   * Expires `pending_payment` orders past their payment window, returns
   * expired cart holds to `available`, and drops them from carts. Orders in
   * `pending_verification` never expire: the buyer has paid and waits on RAD.
   * Safe to call concurrently.
   */
  async releaseExpiredHolds(): Promise<string[]> {
    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const overdue = await manager
        .createQueryBuilder()
        .update(Order)
        .set({ status: "expired" })
        .where("status = :pending", { pending: "pending_payment" })
        .andWhere('"paymentDueAt" <= :now', { now })
        .returning(["id", "ownerKey"])
        .execute();
      const expiredOrders = (overdue.raw ?? []) as Array<{
        id: string;
        ownerKey: string;
      }>;
      const restocked = await this.closeExpiredOrders(manager, expiredOrders);

      const released = await manager
        .createQueryBuilder()
        .update(Product)
        .set({ status: "available", holdExpiresAt: null, heldBy: null })
        .where("status = :sold", { sold: "sold" })
        .andWhere('"holdExpiresAt" <= :now', { now })
        .returning(["slug"])
        .execute();
      const slugs = ((released.raw ?? []) as Array<{ slug: string }>).map(
        (row) => row.slug,
      );
      if (slugs.length) {
        await manager
          .getRepository(CartItem)
          .delete({ productSlug: In(slugs) });
        await this.expireUnpaidOrdersFor(manager, slugs);
      }
      return [...restocked, ...slugs];
    });
  }

  /** Holds an available work for this cart owner, or confirms an existing hold. */
  async hold(ownerKey: string, slug: string): Promise<Date> {
    await this.releaseExpiredHolds();
    const products = this.dataSource.getRepository(Product);
    const expiresAt = new Date(Date.now() + CART_HOLD_MS);
    const result = await products.update(
      { slug, status: "available" },
      { status: "sold", holdExpiresAt: expiresAt, heldBy: ownerKey },
    );
    if (result.affected) return expiresAt;

    const product = await products.findOne({
      where: { slug },
      select: { id: true, status: true, heldBy: true, holdExpiresAt: true },
    });
    if (!product || !this.isPublic(product.status)) {
      throw new NotFoundException("اثر پیدا نشد.");
    }
    if (product.heldBy === ownerKey && product.holdExpiresAt) {
      return product.holdExpiresAt;
    }
    throw new ConflictException("این اثر دیگر قابل افزودن به سبد نیست.");
  }

  /** Releases this owner's unpaid cart holds on the given works. */
  async releaseCartHolds(
    ownerKey: string,
    slugs: string[],
    manager?: EntityManager,
  ) {
    if (!slugs.length) return;
    await (manager ?? this.dataSource.manager).getRepository(Product).update(
      {
        slug: In(slugs),
        status: "sold",
        heldBy: ownerKey,
        holdExpiresAt: Not(IsNull()),
      },
      { status: "available", holdExpiresAt: null, heldBy: null },
    );
  }

  /** Current hold deadlines for this owner, keyed by slug. */
  async holdsFor(
    ownerKey: string,
    slugs: string[],
  ): Promise<Record<string, number>> {
    if (!slugs.length) return {};
    const rows = await this.dataSource.getRepository(Product).find({
      where: {
        slug: In(slugs),
        status: "sold",
        heldBy: ownerKey,
        holdExpiresAt: Not(IsNull()),
      },
      select: { slug: true, holdExpiresAt: true },
    });
    return Object.fromEntries(
      rows.map((row) => [row.slug, (row.holdExpiresAt as Date).getTime()]),
    );
  }

  /**
   * Checkout: every work must still be held by this owner. Works whose cart
   * row predates holds are claimed now if still available.
   */
  async assertHeldForCheckout(
    manager: EntityManager,
    ownerKey: string,
    products: Product[],
  ) {
    const now = Date.now();
    const repo = manager.getRepository(Product);
    for (const product of products) {
      const heldByOwner =
        product.status === "sold" &&
        product.heldBy === ownerKey &&
        product.holdExpiresAt &&
        product.holdExpiresAt.getTime() > now;
      if (heldByOwner) continue;
      if (product.status === "available") {
        const claimed = await repo.update(
          { id: product.id, status: "available" },
          {
            status: "sold",
            holdExpiresAt: new Date(now + CART_HOLD_MS),
            heldBy: ownerKey,
          },
        );
        if (claimed.affected) continue;
      }
      throw new ConflictException(`اثر «${product.name}» دیگر قابل خرید نیست.`);
    }
  }

  /** A valid order was created: reserve its works until the payment deadline. */
  async reserveForOrder(
    manager: EntityManager,
    ownerKey: string,
    slugs: string[],
    until: Date,
  ) {
    if (!slugs.length) return;
    await manager
      .getRepository(Product)
      .update(
        { slug: In(slugs), status: "sold", heldBy: ownerKey },
        { holdExpiresAt: until },
      );
  }

  /** Every work must still be reserved for this owner, otherwise 409. */
  async assertReservedFor(
    manager: EntityManager,
    ownerKey: string,
    slugs: string[],
  ) {
    const held = await manager.getRepository(Product).count({
      where: { slug: In(slugs), status: "sold", heldBy: ownerKey },
    });
    if (held !== slugs.length) {
      throw new ConflictException(
        "رزرو این سفارش تمام شده و اثر به فروشگاه برگشته است.",
      );
    }
  }

  /** Customer submitted proof of payment: stop the hold clock, keep it sold. */
  async stopHoldClock(
    manager: EntityManager,
    ownerKey: string,
    slugs: string[],
  ) {
    if (!slugs.length) return;
    await manager
      .getRepository(Product)
      .update(
        { slug: In(slugs), status: "sold", heldBy: ownerKey },
        { holdExpiresAt: null },
      );
  }

  /** Payment verified or order fulfilled: permanently sold. */
  async markSold(manager: EntityManager, slugs: string[]) {
    if (!slugs.length) return;
    await manager
      .getRepository(Product)
      .update(
        { slug: In(slugs) },
        { status: "sold", holdExpiresAt: null, heldBy: null },
      );
  }

  /** Order cancelled or returned: the work goes back on sale. */
  async restock(manager: EntityManager, slugs: string[], ownerKey?: string) {
    if (!slugs.length) return;
    await manager.getRepository(Product).update(
      {
        slug: In(slugs),
        status: "sold",
        ...(ownerKey ? { heldBy: ownerKey } : {}),
      },
      { status: "available", holdExpiresAt: null, heldBy: null },
    );
  }

  /** Guest signed in: their holds follow the cart to the user account. */
  async transferHolds(from: string, to: string) {
    await this.dataSource
      .getRepository(Product)
      .update({ heldBy: from }, { heldBy: to });
  }

  /** Staff edits: enforce the state machine and never touch a held work. */
  assertManualTransition(
    current: Pick<Product, "status" | "heldBy">,
    next: ProductStatus,
  ) {
    const from = normalizeProductStatus(current.status);
    if (from === next) return;
    if (current.heldBy) {
      throw new ConflictException(
        "این اثر در سبد یا سفارش باز یک مشتری است؛ وضعیتش پس از پرداخت یا آزاد شدن قابل تغییر است.",
      );
    }
    if (!canTransitionProductStatus(from, next)) {
      throw new BadRequestException(
        `تغییر وضعیت از «${from}» به «${next}» مجاز نیست.`,
      );
    }
  }

  /** Fails the payment and restocks the works of orders that just expired. */
  private async closeExpiredOrders(
    manager: EntityManager,
    orders: Array<{ id: string; ownerKey: string }>,
  ) {
    if (!orders.length) return [];
    await manager
      .getRepository(PaymentIntent)
      .update(
        { orderId: In(orders.map((order) => order.id)), status: "created" },
        { status: "failed" },
      );
    const restocked: string[] = [];
    for (const order of orders) {
      const items = await manager.getRepository(OrderItem).find({
        where: { orderId: order.id },
        select: { productSlug: true },
      });
      const slugs = items.map((item) => item.productSlug);
      await this.restock(manager, slugs, order.ownerKey);
      restocked.push(...slugs);
    }
    return restocked;
  }

  /** Orders created before `paymentDueAt` existed expire with their cart hold. */
  private async expireUnpaidOrdersFor(manager: EntityManager, slugs: string[]) {
    const pending = await manager
      .getRepository(OrderItem)
      .createQueryBuilder("item")
      .innerJoin("item.order", "order")
      .select('DISTINCT "item"."orderId"', "orderId")
      .where('"item"."productSlug" IN (:...slugs)', { slugs })
      .andWhere('"order"."status" = :pending', { pending: "pending_payment" })
      .getRawMany<{ orderId: string }>();
    const orderIds = pending.map((row) => row.orderId);
    if (!orderIds.length) return;

    await manager
      .getRepository(Order)
      .update(
        { id: In(orderIds), status: "pending_payment" },
        { status: "expired" },
      );
    await manager
      .getRepository(PaymentIntent)
      .update(
        { orderId: In(orderIds), status: Not(In(["submitted", "verified"])) },
        { status: "failed" },
      );
    const siblings = await manager.getRepository(OrderItem).find({
      where: { orderId: In(orderIds) },
      select: { productSlug: true },
    });
    await manager.getRepository(Product).update(
      {
        slug: In(siblings.map((item) => item.productSlug)),
        status: "sold",
        holdExpiresAt: Not(IsNull()),
      },
      { status: "available", holdExpiresAt: null, heldBy: null },
    );
  }

  private async migrateLegacyStatuses() {
    const products = this.dataSource.getRepository(Product);
    for (const [legacy, next] of Object.entries(LEGACY_PRODUCT_STATUS)) {
      const result = await products.update(
        { status: legacy },
        { status: next },
      );
      if (result.affected) {
        this.logger.log(
          `Migrated ${result.affected} product(s) from "${legacy}" to "${next}".`,
        );
      }
    }
  }
}
