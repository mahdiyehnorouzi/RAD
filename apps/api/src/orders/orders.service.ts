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
import { verifyZarinpalPayment } from "../payment/zarinpal.adapter";
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
    // Same reasoning as InventoryService: a one-time legacy-status rewrite
    // must not be able to crash the whole API on a transient DB hiccup at
    // boot. Log and move on; it retries harmlessly on the next restart.
    try {
      await migrateLegacyOrderStatuses(this.dataSource, this.logger);
    } catch (error) {
      this.logger.warn(
        `Legacy order status migration skipped (will retry on next boot): ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
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
      const session = await startPaymentSession({
        orderId: order.id,
        amount: order.total,
        currency: "IRR",
        callbackUrl: `${process.env.STOREFRONT_ORIGIN || "http://localhost:3000"}/checkout/${order.id}`,
        mobile: phone,
      });
      if (session.kind === "redirect") {
        redirectUrl = session.redirectUrl;
        await this.payments.update(
          { orderId: order.id },
          {
            status: "redirected",
            provider: session.provider,
            gatewayAuthority: session.authority,
          },
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
      throw new BadRequestException({
        message: "برای تأیید پرداخت، تصویر رسید را بارگذاری کنید.",
        code: "receipt_required",
      });
    }
    try {
      assertImageData(receiptImage, receiptImageLimit, receiptImageError);
    } catch (error) {
      throw new BadRequestException({
        message: error instanceof Error ? error.message : receiptImageError,
        code: "receipt_invalid",
      });
    }
    const trackingNumber = normalizeTrackingNumber(input.trackingNumber ?? "");
    if (input.trackingNumber?.trim() && !trackingNumber) {
      throw new BadRequestException({
        message:
          "شماره پیگیری واریز را درست وارد کنید (۴ تا ۳۲ رقم یا حرف لاتین).",
        code: "tracking_invalid",
      });
    }
    const hash = receiptHash(receiptImage);
    const ownerKey = this.identity.key(actor);

    await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwnedOrder(manager, ownerKey, id);
      const status = normalizeStoreOrderStatus(order.status);

      const payments = manager.getRepository(PaymentIntent);
      const payment = await payments.findOne({ where: { orderId: order.id } });
      if (!payment) {
        throw new NotFoundException({
          message: "پرداخت این سفارش پیدا نشد.",
          code: "payment_missing",
        });
      }

      // Idempotency: a double-click or a retry after a dropped response
      // resends the exact same receipt. If it matches what's already on
      // file for this order, treat it as a no-op success instead of
      // re-validating state, burning a submission slot, or touching rows.
      const isIdenticalResubmit =
        payment.status === "submitted" &&
        payment.receiptHash === hash &&
        (payment.trackingNumber ?? null) === trackingNumber;
      if (isIdenticalResubmit) return;

      this.assertCanSubmitReceipt(status, order.paymentDueAt);
      if (payment.receiptSubmissions >= MAX_RECEIPT_SUBMISSIONS) {
        throw new BadRequestException({
          message:
            "تعداد دفعات ارسال رسید به سقف رسیده؛ لطفاً با پشتیبانی رَد تماس بگیرید.",
          code: "receipt_limit",
        });
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

  /**
   * ZarinPal redirected the buyer back with `Authority` + `Status`. Verifies
   * server-to-server before trusting anything, then — for a genuine success —
   * confirms the order and sells the work in the same transaction used for a
   * manually-reviewed receipt (`PaymentReviewService.approve`).
   *
   * Idempotent: a duplicate callback (refresh, double submit, browser back)
   * on an already-verified payment is a no-op that re-reads the stored state
   * rather than calling ZarinPal again.
   *
   * The slow part — the ZarinPal network call — deliberately happens OUTSIDE
   * any DB transaction, bracketed by two short, row-locked transactions: one
   * to validate/short-circuit before we call out, one to apply the result.
   * This keeps the Order row locked for milliseconds of local DB work, not
   * for however long ZarinPal takes to answer (up to our 15s adapter
   * timeout), so a slow or hung verify call can't block the rest of the
   * order (admin review, the inventory sweep, a concurrent duplicate
   * callback) for its full duration.
   */
  async verifyGatewayPayment(
    actor: Actor,
    id: string,
    input: { authority?: string; status?: string },
  ) {
    await this.inventory.releaseExpiredHolds();
    const ownerKey = this.identity.key(actor);
    const authority = input.authority?.trim() ?? "";
    const gatewayOk = input.status?.trim().toUpperCase() === "OK";

    const precheck = await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwnedOrder(manager, ownerKey, id);
      const payments = manager.getRepository(PaymentIntent);
      const payment = await payments.findOne({ where: { orderId: order.id } });
      if (!payment) {
        throw new NotFoundException({
          message: "پرداخت این سفارش پیدا نشد.",
          code: "payment_missing",
        });
      }
      // Already settled (verified or in permanent conflict): nothing to do.
      if (payment.status === "verified" || payment.status === "verify_conflict") {
        return "noop" as const;
      }
      if (!authority || payment.gatewayAuthority !== authority) {
        throw new BadRequestException({
          message: "این بازگشت از درگاه پرداخت برای این سفارش معتبر نیست.",
          code: "payment_authority_mismatch",
        });
      }
      if (!gatewayOk) {
        await payments.update({ orderId: order.id }, { status: "failed" });
        return "failed" as const;
      }
      return "verify" as const;
    });

    if (precheck === "verify") {
      await this.verifyAndApplyGatewayResult(actor, id, authority);
    }
    return toOrder(await this.ownedOrder(actor, id));
  }

  /**
   * Calls ZarinPal's verify endpoint (no lock held) for `authority`, then —
   * under a short, re-validated lock — applies exactly one of: confirmed
   * (sell the work), verify_conflict (paid, but the reservation was lost —
   * needs a manual refund, never double-sold), or verify_error (ZarinPal was
   * unreachable or ambiguous — resolved later by a reconciliation retry).
   *
   * The `order_confirmed` notice fires only on the branch that actually
   * commits `status: "confirmed"` in this call — never for a no-op, a
   * failure, a conflict, or an error, even though this function (and its
   * callers) may run more than once for the same order.
   */
  private async verifyAndApplyGatewayResult(
    actor: Actor,
    id: string,
    authority: string,
  ): Promise<{ confirmed: boolean; conflict: boolean; reachable: boolean }> {
    const ownerKey = this.identity.key(actor);
    const paymentRow = await this.payments.findOne({ where: { orderId: id } });
    if (!paymentRow) {
      throw new NotFoundException({
        message: "پرداخت این سفارش پیدا نشد.",
        code: "payment_missing",
      });
    }

    let refId: string | undefined;
    let reachable = true;
    try {
      const verified = await verifyZarinpalPayment({
        amountToman: paymentRow.amount,
        authority,
      });
      refId = verified.refId;
    } catch (error) {
      this.logger.error(
        `Zarinpal verify failed for order ${id}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      reachable = false;
    }

    let confirmed = false;
    let conflict = false;
    await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwnedOrder(manager, ownerKey, id);
      const payments = manager.getRepository(PaymentIntent);
      const payment = await payments.findOne({ where: { orderId: order.id } });
      // Re-check under lock: a concurrent duplicate call may have already
      // settled (or re-requested) this payment while we were waiting on
      // ZarinPal above.
      if (
        !payment ||
        payment.status === "verified" ||
        payment.status === "verify_conflict" ||
        payment.gatewayAuthority !== authority
      ) {
        return;
      }

      if (!reachable) {
        await payments.update({ orderId: order.id }, { status: "verify_error" });
        return;
      }

      const items = await manager.getRepository(OrderItem).find({
        where: { orderId: order.id },
        select: { productSlug: true },
      });
      const slugs = items.map((item) => item.productSlug);

      try {
        await this.inventory.assertReservedFor(manager, ownerKey, slugs);
      } catch {
        // Money was captured but the hold is gone (e.g. verify arrived after
        // the payment window expired and the work was resold). RAD must not
        // double-sell a 1/1 work — leave it unsold and flag for a refund.
        this.logger.error(
          `Zarinpal verified order ${order.id} (ref ${refId}) but its ` +
            `reservation was already lost — needs manual refund/reconciliation.`,
        );
        await payments.update(
          { orderId: order.id },
          { status: "verify_conflict", gatewayRefId: refId, verifiedAt: new Date() },
        );
        conflict = true;
        return;
      }

      await this.inventory.markSold(manager, slugs);
      await payments.update(
        { orderId: order.id },
        { status: "verified", gatewayRefId: refId, verifiedAt: new Date() },
      );
      await manager.getRepository(Order).update(
        { id: order.id },
        {
          status: "confirmed",
          paymentDueAt: null,
          estimatedDeliveryAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        },
      );
      confirmed = true;
    });

    if (confirmed) {
      await this.notices.create(actor, "order_confirmed", undefined);
    }
    return { confirmed, conflict, reachable };
  }

  /**
   * Buyer's gateway attempt failed, was cancelled, or needs a fresh
   * Authority. Starts a new ZarinPal session for the SAME order — never a
   * duplicate order — as long as it's still `pending_payment` and the works
   * are still held for this buyer.
   *
   * Safety-critical exception: a payment stuck in `verify_error` means we
   * genuinely don't know whether ZarinPal captured the charge — our own
   * verify call failed, not the payment itself. Starting a brand-new gateway
   * session in that state risks the buyer paying twice. So instead of
   * retrying blindly, this re-attempts verification against the ORIGINAL
   * Authority first (ZarinPal's verify is idempotent — safe to call again):
   * if that resolves to success, the order is confirmed here and no new
   * session is started; if it resolves to a lost reservation, it's flagged
   * for manual refund same as above; if it's still ambiguous, the retry is
   * refused outright rather than risk a double charge. `verify_conflict`
   * (money already captured, reservation lost) can never be retried — it
   * needs a human refund, not another payment attempt.
   */
  async retryGatewayPayment(actor: Actor, id: string) {
    await this.inventory.releaseExpiredHolds();
    const ownerKey = this.identity.key(actor);

    const needsReconciliation = () =>
      new BadRequestException({
        message:
          "این سفارش قبلاً از درگاه پرداخت تأیید شده یا نیاز به بررسی دستی دارد؛ امکان پرداخت دوباره نیست. برای بازگشت وجه با پشتیبانی رَد تماس بگیرید.",
        code: "payment_needs_reconciliation",
      });

    const prep = await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwnedOrder(manager, ownerKey, id);
      if (normalizeStoreOrderStatus(order.status) !== "pending_payment") {
        throw new BadRequestException({
          message: "این سفارش دیگر در انتظار پرداخت نیست.",
          code: "order_not_payable",
        });
      }
      const payments = manager.getRepository(PaymentIntent);
      const payment = await payments.findOne({ where: { orderId: id } });
      if (!payment || payment.provider !== "zarinpal") {
        throw new BadRequestException({
          message: "این سفارش از درگاه آنلاین پرداخت نمی‌شود.",
          code: "payment_not_gateway",
        });
      }
      if (payment.status === "verify_conflict" || payment.status === "verified") {
        throw needsReconciliation();
      }
      if (payment.status === "verify_error") {
        return {
          needsReconcile: true as const,
          authority: payment.gatewayAuthority ?? "",
        };
      }
      const items = await manager.getRepository(OrderItem).find({
        where: { orderId: id },
        select: { productSlug: true },
      });
      await this.inventory.assertReservedFor(
        manager,
        ownerKey,
        items.map((item) => item.productSlug),
      );
      return {
        needsReconcile: false as const,
        amount: payment.amount,
        phone: order.phone,
      };
    });

    if (prep.needsReconcile) {
      if (!prep.authority) throw needsReconciliation();
      const result = await this.verifyAndApplyGatewayResult(actor, id, prep.authority);
      if (result.confirmed || result.conflict) {
        return toOrder(await this.ownedOrder(actor, id));
      }
      throw new BadRequestException({
        message:
          "وضعیت پرداخت قبلی هنوز نامشخص است؛ چند دقیقه دیگر دوباره امتحان کن یا با پشتیبانی رَد تماس بگیر. اگر مبلغی کسر شده باشد از بین نمی‌رود.",
        code: "payment_reconciliation_pending",
      });
    }

    const session = await startPaymentSession({
      orderId: id,
      amount: prep.amount,
      currency: "IRR",
      callbackUrl: `${process.env.STOREFRONT_ORIGIN || "http://localhost:3000"}/checkout/${id}`,
      mobile: prep.phone,
    });
    if (session.kind !== "redirect") {
      throw new ServiceUnavailableException("شروع پرداخت ممکن نیست.");
    }

    await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwnedOrder(manager, ownerKey, id);
      // Lost the race while the gateway request was in flight (e.g. the
      // order expired or was cancelled in the meantime): leave the stale
      // authority alone rather than resurrect a dead order.
      if (normalizeStoreOrderStatus(order.status) !== "pending_payment") return;
      await manager.getRepository(PaymentIntent).update(
        { orderId: id },
        {
          status: "redirected",
          provider: session.provider,
          gatewayAuthority: session.authority,
        },
      );
    });

    return toOrder(await this.ownedOrder(actor, id), session.redirectUrl);
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
        throw new BadRequestException({
          message:
            "مهلت پرداخت این سفارش تمام شده و اثر به فروشگاه برگشته است.",
          code: "order_expired",
        });
      }
      return;
    }
    if (status === "pending_verification") return;
    if (status === "expired") {
      throw new BadRequestException({
        message: "مهلت پرداخت این سفارش تمام شده و اثر به فروشگاه برگشته است.",
        code: "order_expired",
      });
    }
    if (status === "rejected") {
      throw new BadRequestException({
        message:
          "پرداخت این سفارش رد شده است؛ برای خرید دوباره سفارش تازه ثبت کنید.",
        code: "order_rejected",
      });
    }
    if (status === "cancelled" || status === "returned") {
      throw new BadRequestException({
        message: "این سفارش بسته شده است.",
        code: "order_closed",
      });
    }
    throw new BadRequestException({
      message: "پرداخت این سفارش قبلاً تأیید شده است.",
      code: "order_already_confirmed",
    });
  }

  /** One transfer pays for one order: tracking number and image must be new. */
  private async assertReceiptNotReused(
    manager: EntityManager,
    orderId: string,
    trackingNumber: string | null,
    hash: string,
  ) {
    const reused = await manager.getRepository(PaymentIntent).findOne({
      where: [
        ...(trackingNumber
          ? [
              {
                orderId: Not(orderId),
                trackingNumber,
                status: In(["submitted", "verified"]),
              },
            ]
          : []),
        {
          orderId: Not(orderId),
          receiptHash: hash,
          status: In(["submitted", "verified"]),
        },
      ],
      select: { id: true },
    });
    if (reused) {
      throw new ConflictException({
        message: "این رسید یا شماره پیگیری قبلاً برای سفارش دیگری ثبت شده است.",
        code: "receipt_duplicate",
      });
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
    if (!order) {
      throw new NotFoundException({
        message: "سفارش پیدا نشد.",
        code: "order_not_found",
      });
    }
    return order;
  }

  private async ownedOrder(actor: Actor, id: string) {
    const order = await this.orders.findOne({
      where: { id, ownerKey: this.identity.key(actor) },
      relations: orderRelations,
    });
    if (!order) {
      throw new NotFoundException({
        message: "سفارش پیدا نشد.",
        code: "order_not_found",
      });
    }
    return order;
  }
}
