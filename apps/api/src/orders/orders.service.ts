import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Not, Repository, type EntityManager } from "typeorm";
import {
  CartItem,
  Order,
  OrderItem,
  PaymentIntent,
  Product,
} from "../database/entities";
import { IdentityService } from "../common/identity.service";
import { NoticesService } from "../notices/notices.service";
import { InventoryService } from "../inventory/inventory.service";
import type { Actor } from "../common/identity";
import {
  paymentProvider,
  startPaymentSession,
} from "../payment/payment-session";
import {
  assertImageData,
  receiptImageError,
  receiptImageLimit,
} from "../common/image-data";
import { ORDER_POLICY_SLUGS } from "../policies/const";
import { acceptedPolicyVersions } from "../policies/policy-acceptance";
import { ORDER_PAYMENT_WINDOW_MS } from "./const";
import { toOrder } from "./order.mapper";
import { nextOrderId } from "./order-id";
import { migrateLegacyOrderStatuses } from "./order-status.migration";
import {
  normalizePhone,
  normalizeTrackingNumber,
  receiptHash,
} from "./payment-receipt";
import { normalizeStoreOrderStatus } from "./store-order-status";
import type { StoreOrderStatus } from "./type";

const orderRelations = { items: true, payment: true } as const;
const MAX_RECEIPT_SUBMISSIONS = 5;

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(CartItem)
    private readonly cartItems: Repository<CartItem>,
    @InjectRepository(PaymentIntent)
    private readonly payments: Repository<PaymentIntent>,
    private readonly identity: IdentityService,
    private readonly notices: NoticesService,
    private readonly inventory: InventoryService,
  ) {}

  async onModuleInit() {
    await migrateLegacyOrderStatuses(this.dataSource, this.logger);
  }

  async list(actor: Actor) {
    await this.inventory.releaseExpiredHolds();
    const orders = await this.orders.find({
      where: { ownerKey: this.identity.key(actor) },
      relations: orderRelations,
      order: { createdAt: "DESC" },
    });
    return orders.map((order) => toOrder(order));
  }

  async get(actor: Actor, id: string) {
    await this.inventory.releaseExpiredHolds();
    return toOrder(await this.ownedOrder(actor, id));
  }

  /**
   * Creates a `pending_payment` order from the cart. Its works stay reserved
   * for {@link ORDER_PAYMENT_WINDOW_MS}; without a receipt the order expires.
   */
  async checkout(
    actor: Actor,
    input: {
      name?: string;
      city?: string;
      phone?: string;
      address?: string;
      acceptedPolicies?: Record<string, string>;
    },
  ) {
    const policyVersions = acceptedPolicyVersions(
      input.acceptedPolicies,
      ORDER_POLICY_SLUGS,
      "برای ثبت سفارش، شرایط خرید، ارسال و بازگشت را بخوان و تیک پذیرش را بزن.",
    );
    await this.inventory.releaseExpiredHolds();
    const ownerKey = this.identity.key(actor);
    const cart = await this.cartItems.find({
      where: { ownerKey },
      relations: { product: true },
    });
    if (!cart.length) throw new BadRequestException("سبد خرید خالی است.");

    const phone = normalizePhone(input.phone);
    if (!phone) {
      throw new BadRequestException(
        "شماره تماس معتبر برای پیگیری سفارش وارد کنید.",
      );
    }
    const name = input.name?.trim() || actor.user?.name || "کاربر رَد";
    const city = input.city?.trim() || "تهران";
    const slugs = cart.map((item) => item.productSlug);
    const provider = paymentProvider();

    const order = await this.dataSource.transaction(async (manager) => {
      const products = await manager.getRepository(Product).find({
        where: { slug: In(slugs) },
        lock: { mode: "pessimistic_write" },
      });
      if (products.length !== slugs.length) {
        throw new BadRequestException("یکی از آثار سبد دیگر موجود نیست.");
      }
      await this.inventory.assertHeldForCheckout(manager, ownerKey, products);
      if (
        products.some(
          (product) => product.tomanPrice === null || product.usdPrice === null,
        )
      ) {
        throw new BadRequestException("یکی از آثار سبد قیمت فروش ندارد.");
      }

      const total = products.reduce(
        (sum, product) => sum + (product.tomanPrice ?? 0),
        0,
      );
      const usdTotal = products.reduce(
        (sum, product) => sum + (product.usdPrice ?? 0),
        0,
      );
      const id = await nextOrderId(manager.getRepository(Order));
      const paymentDueAt = new Date(Date.now() + ORDER_PAYMENT_WINDOW_MS);

      const created = manager.getRepository(Order).create({
        id,
        ownerKey,
        userId: actor.user?.id ?? null,
        total,
        usdTotal,
        status: "pending_payment",
        paymentDueAt,
        name,
        city,
        phone,
        address: input.address?.trim() ?? "",
        policyVersions,
        policiesAcceptedAt: new Date(),
      });
      await manager.getRepository(Order).save(created);

      const items = slugs.map((productSlug) =>
        manager.getRepository(OrderItem).create({ orderId: id, productSlug }),
      );
      await manager.getRepository(OrderItem).save(items);

      const payment = manager.getRepository(PaymentIntent).create({
        orderId: id,
        amount: total,
        currency: "IRR",
        provider,
        status: "created",
      });
      await manager.getRepository(PaymentIntent).save(payment);

      await this.inventory.reserveForOrder(
        manager,
        ownerKey,
        slugs,
        paymentDueAt,
      );
      await manager.getRepository(CartItem).delete({ ownerKey });

      return created;
    });

    let redirectUrl: string | undefined;
    try {
      const session = startPaymentSession({
        orderId: order.id,
        amount: order.total,
        currency: "IRR",
        callbackUrl: `${process.env.STOREFRONT_ORIGIN || "http://localhost:3000"}/orders/${order.id}`,
      });
      if (session.kind === "redirect") {
        redirectUrl = session.redirectUrl;
        await this.payments.update(
          { orderId: order.id },
          { status: "redirected", provider: session.provider },
        );
      }
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : "شروع پرداخت ممکن نیست.",
      );
    }

    await this.notices.create(actor, "order", slugs[0]);
    const saved = await this.orders.findOneOrFail({
      where: { id: order.id },
      relations: orderRelations,
    });
    return toOrder(saved, redirectUrl);
  }

  /**
   * Customer submits the card-to-card receipt and bank tracking number.
   * `pending_payment` → `pending_verification`; the reservation stops
   * expiring. While still awaiting review the customer may replace it.
   */
  async confirmPayment(
    actor: Actor,
    id: string,
    input: { receiptImage?: string; trackingNumber?: string } = {},
  ) {
    await this.inventory.releaseExpiredHolds();
    const receiptImage = input.receiptImage?.trim() ?? "";
    if (!receiptImage) {
      throw new BadRequestException(
        "برای تأیید پرداخت، تصویر رسید را بارگذاری کنید.",
      );
    }
    try {
      assertImageData(receiptImage, receiptImageLimit, receiptImageError);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : receiptImageError,
      );
    }
    const trackingNumber = normalizeTrackingNumber(input.trackingNumber);
    if (!trackingNumber) {
      throw new BadRequestException(
        "شماره پیگیری واریز را درست وارد کنید (۴ تا ۳۲ رقم یا حرف لاتین).",
      );
    }
    const hash = receiptHash(receiptImage);
    const ownerKey = this.identity.key(actor);

    await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwnedOrder(manager, ownerKey, id);
      const status = normalizeStoreOrderStatus(order.status);
      this.assertCanSubmitReceipt(status, order.paymentDueAt);

      const payments = manager.getRepository(PaymentIntent);
      const payment = await payments.findOne({ where: { orderId: order.id } });
      if (!payment) throw new NotFoundException("پرداخت این سفارش پیدا نشد.");
      if (payment.receiptSubmissions >= MAX_RECEIPT_SUBMISSIONS) {
        throw new BadRequestException(
          "تعداد دفعات ارسال رسید به سقف رسیده؛ لطفاً با پشتیبانی رَد تماس بگیرید.",
        );
      }
      await this.assertReceiptNotReused(
        manager,
        order.id,
        trackingNumber,
        hash,
      );

      const items = await manager.getRepository(OrderItem).find({
        where: { orderId: order.id },
        select: { productSlug: true },
      });
      const slugs = items.map((item) => item.productSlug);
      await this.inventory.assertReservedFor(manager, ownerKey, slugs);

      await payments.update(
        { orderId: order.id },
        {
          status: "submitted",
          receiptImage,
          receiptHash: hash,
          trackingNumber,
          submittedAt: new Date(),
          receiptSubmissions: payment.receiptSubmissions + 1,
        },
      );
      if (status === "pending_payment") {
        await manager
          .getRepository(Order)
          .update(
            { id: order.id },
            { status: "pending_verification", paymentDueAt: null },
          );
        await this.inventory.stopHoldClock(manager, ownerKey, slugs);
      }
    });

    return toOrder(await this.ownedOrder(actor, id));
  }

  /** @deprecated Alias kept so existing clients keep working until renamed. */
  confirmDemoPayment(
    actor: Actor,
    id: string,
    input?: { receiptImage?: string; trackingNumber?: string },
  ) {
    return this.confirmPayment(actor, id, input);
  }

  /** Buyer backs out before paying; paid orders wait for RAD's review instead. */
  async cancel(actor: Actor, id: string) {
    await this.inventory.releaseExpiredHolds();
    const ownerKey = this.identity.key(actor);
    await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwnedOrder(manager, ownerKey, id);
      const status = normalizeStoreOrderStatus(order.status);
      if (status === "pending_verification") {
        throw new BadRequestException(
          "رسید این سفارش در حال بررسی است؛ برای لغو با پشتیبانی رَد تماس بگیرید.",
        );
      }
      if (status !== "pending_payment") {
        throw new BadRequestException(
          "فقط سفارش در انتظار پرداخت را می‌توان لغو کرد.",
        );
      }
      const items = await manager.getRepository(OrderItem).find({
        where: { orderId: order.id },
        select: { productSlug: true },
      });
      await this.inventory.restock(
        manager,
        items.map((item) => item.productSlug),
        ownerKey,
      );
      await manager
        .getRepository(PaymentIntent)
        .update({ orderId: order.id }, { status: "failed" });
      await manager
        .getRepository(Order)
        .update({ id: order.id }, { status: "cancelled", paymentDueAt: null });
    });
    return toOrder(await this.ownedOrder(actor, id));
  }

  private assertCanSubmitReceipt(
    status: StoreOrderStatus,
    paymentDueAt: Date | null,
  ) {
    if (status === "pending_payment") {
      if (paymentDueAt && paymentDueAt.getTime() <= Date.now()) {
        throw new BadRequestException(
          "مهلت پرداخت این سفارش تمام شده و اثر به فروشگاه برگشته است.",
        );
      }
      return;
    }
    if (status === "pending_verification") return;
    if (status === "expired") {
      throw new BadRequestException(
        "مهلت پرداخت این سفارش تمام شده و اثر به فروشگاه برگشته است.",
      );
    }
    if (status === "rejected") {
      throw new BadRequestException(
        "پرداخت این سفارش رد شده است؛ برای خرید دوباره سفارش تازه ثبت کنید.",
      );
    }
    if (status === "cancelled" || status === "returned") {
      throw new BadRequestException("این سفارش بسته شده است.");
    }
    throw new BadRequestException("پرداخت این سفارش قبلاً تأیید شده است.");
  }

  /** One transfer pays for one order: tracking number and image must be new. */
  private async assertReceiptNotReused(
    manager: EntityManager,
    orderId: string,
    trackingNumber: string,
    hash: string,
  ) {
    const reused = await manager.getRepository(PaymentIntent).findOne({
      where: [
        {
          orderId: Not(orderId),
          trackingNumber,
          status: In(["submitted", "verified"]),
        },
        {
          orderId: Not(orderId),
          receiptHash: hash,
          status: In(["submitted", "verified"]),
        },
      ],
      select: { id: true },
    });
    if (reused) {
      throw new ConflictException(
        "این رسید یا شماره پیگیری قبلاً برای سفارش دیگری ثبت شده است.",
      );
    }
  }

  /** Row lock serialises receipt uploads, cancels, reviews, and the expiry sweep. */
  private async lockOwnedOrder(
    manager: EntityManager,
    ownerKey: string,
    id: string,
  ) {
    const order = await manager.getRepository(Order).findOne({
      where: { id, ownerKey },
      lock: { mode: "pessimistic_write" },
    });
    if (!order) throw new NotFoundException("سفارش پیدا نشد.");
    return order;
  }

  private async ownedOrder(actor: Actor, id: string) {
    const order = await this.orders.findOne({
      where: { id, ownerKey: this.identity.key(actor) },
      relations: orderRelations,
    });
    if (!order) throw new NotFoundException("سفارش پیدا نشد.");
    return order;
  }
}
