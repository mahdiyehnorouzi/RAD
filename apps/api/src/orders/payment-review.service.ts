import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, type EntityManager } from "typeorm";
import { Order, OrderItem, PaymentIntent, User } from "../database/entities";
import { InventoryService } from "../inventory/inventory.service";
import { MailService } from "../mail/mail.service";
import { NoticesService } from "../notices/notices.service";
import { PAYMENT_REJECTION_REASON_MAX } from "./const";
import { normalizeStoreOrderStatus } from "./store-order-status";

/**
 * RAD's decision on a card-to-card receipt. Only `pending_verification`
 * orders can be reviewed; confirming sells the work for good, rejecting
 * puts it back on sale.
 */
@Injectable()
export class PaymentReviewService {
  private readonly logger = new Logger(PaymentReviewService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly inventory: InventoryService,
    private readonly notices: NoticesService,
    private readonly mail: MailService,
  ) {}

  async approve(orderId: string, reviewerId: string | null) {
    const order = await this.dataSource.transaction(async (manager) => {
      const locked = await this.lockForReview(manager, orderId);
      const slugs = await this.orderSlugs(manager, orderId);
      await this.inventory.assertReservedFor(manager, locked.ownerKey, slugs);
      await this.inventory.markSold(manager, slugs);
      await manager.getRepository(PaymentIntent).update(
        { orderId },
        {
          status: "verified",
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
          rejectionReason: null,
        },
      );
      await manager.getRepository(Order).update(
        { id: orderId },
        {
          status: "confirmed",
          estimatedDeliveryAt:
            locked.estimatedDeliveryAt ??
            new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        },
      );
      return { ...locked, slugs };
    });

    await this.notify(order, "order_confirmed", (to) =>
      this.mail.sendOrderConfirmed(to, order),
    );
  }

  async reject(orderId: string, reason: string, reviewerId: string | null) {
    const trimmed = reason.trim().slice(0, PAYMENT_REJECTION_REASON_MAX);
    if (trimmed.length < 3) {
      throw new BadRequestException("دلیل رد پرداخت را برای مشتری بنویسید.");
    }
    const order = await this.dataSource.transaction(async (manager) => {
      const locked = await this.lockForReview(manager, orderId);
      const slugs = await this.orderSlugs(manager, orderId);
      await this.inventory.restock(manager, slugs, locked.ownerKey);
      await manager.getRepository(PaymentIntent).update(
        { orderId },
        {
          status: "rejected",
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
          rejectionReason: trimmed,
        },
      );
      await manager
        .getRepository(Order)
        .update({ id: orderId }, { status: "rejected", paymentDueAt: null });
      return { ...locked, slugs };
    });

    await this.notify(order, "order_rejected", (to) =>
      this.mail.sendPaymentRejected(to, { ...order, reason: trimmed }),
    );
  }

  private async lockForReview(manager: EntityManager, orderId: string) {
    const order = await manager.getRepository(Order).findOne({
      where: { id: orderId },
      lock: { mode: "pessimistic_write" },
    });
    if (!order) throw new NotFoundException("سفارش پیدا نشد.");
    const status = normalizeStoreOrderStatus(order.status);
    if (status === "pending_payment") {
      throw new BadRequestException(
        "هنوز رسید پرداخت ارسال نشده. پس از بارگذاری رسید توسط مشتری، پرداخت را بررسی کنید.",
      );
    }
    if (status !== "pending_verification") {
      throw new BadRequestException("پرداخت این سفارش قبلاً بررسی شده است.");
    }
    return order;
  }

  private async orderSlugs(manager: EntityManager, orderId: string) {
    const items = await manager.getRepository(OrderItem).find({
      where: { orderId },
      select: { productSlug: true },
    });
    return items.map((item) => item.productSlug);
  }

  /** In-app notice always; email when the buyer has an account and SMTP is set. */
  private async notify(
    order: Order & { slugs: string[] },
    kind: "order_confirmed" | "order_rejected",
    sendMail: (to: string) => Promise<void>,
  ) {
    await this.notices.createForOwner(order.ownerKey, kind, order.slugs[0]);
    if (!order.userId || !this.mail.isConfigured()) return;
    const user = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id: order.userId }, select: { email: true } });
    if (!user?.email) return;
    try {
      await sendMail(user.email);
    } catch (error) {
      this.logger.warn(
        `Order ${order.id} ${kind} email failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
