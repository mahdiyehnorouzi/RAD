import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import {
  CartItem,
  Order,
  OrderItem,
  PaymentIntent,
  Product,
} from "../database/entities";
import { IdentityService } from "../common/identity.service";
import { NoticesService } from "../notices/notices.service";
import type { Actor } from "../common/identity";
import { normalizeStoreOrderStatus } from "./store-order-status";
import {
  manualCardDetails,
  paymentMode,
  paymentProvider,
  startPaymentSession,
} from "../payment/payment-session";
import {
  assertImageData,
  receiptImageError,
  receiptImageLimit,
} from "../common/image-data";

type PaymentProvider = "sandbox" | "manual_card" | "zarinpal";
type OrderPayment = {
  mode: "manual_card" | "gateway";
  provider: PaymentProvider;
  status: "created" | "redirected" | "submitted" | "verified" | "failed";
  manualCard?: {
    cardNumber: string;
    cardHolder: string;
    bankName?: string;
  };
  redirectUrl?: string;
  receiptImage?: string;
  submittedAt?: number;
};
type OrderRow = {
  id: string;
  total: number;
  usdTotal: number;
  createdAt: Date;
  status: string;
  name: string;
  city: string;
  phone: string;
  address: string;
  trackingCode?: string | null;
  estimatedDeliveryAt?: Date | null;
  items: Array<{ productSlug: string }>;
  payment?: {
    provider: string;
    status: string;
    receiptImage?: string | null;
    submittedAt?: Date | null;
  } | null;
};

@Injectable()
export class OrdersService {
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
  ) {}

  async list(actor: Actor) {
    const orders = await this.orders.find({
      where: { ownerKey: this.identity.key(actor) },
      relations: { items: true, payment: true },
      order: { createdAt: "DESC" },
    });
    return orders.map((order) => this.toOrder(order));
  }

  async get(actor: Actor, id: string) {
    return this.toOrder(await this.ownedOrder(actor, id));
  }

  async checkout(
    actor: Actor,
    input: { name?: string; city?: string; phone?: string; address?: string },
  ) {
    const ownerKey = this.identity.key(actor);
    const cart = await this.cartItems.find({
      where: { ownerKey },
      relations: { product: true },
    });
    if (!cart.length) throw new BadRequestException("سبد خرید خالی است.");

    const name = input.name?.trim() || actor.user?.name || "کاربر رَد";
    const city = input.city?.trim() || "تهران";
    const slugs = cart.map((item) => item.productSlug);
    const provider = paymentProvider();

    const order = await this.dataSource.transaction(async (manager) => {
      const products = await manager.getRepository(Product).find({
        where: { slug: In(slugs) },
      });
      if (products.length !== slugs.length) {
        throw new BadRequestException("یکی از آثار سبد دیگر موجود نیست.");
      }
      for (const product of products) {
        if (product.status !== "available") {
          throw new ConflictException(`اثر «${product.name}» دیگر قابل خرید نیست.`);
        }
      }

      await manager
        .getRepository(Product)
        .update({ slug: In(slugs) }, { status: "reserved" });

      const total = products.reduce((sum, product) => sum + product.tomanPrice, 0);
      const usdTotal = products.reduce((sum, product) => sum + product.usdPrice, 0);
      const id = `RAD-${Date.now().toString().slice(-6)}`;

      const created = manager.getRepository(Order).create({
        id,
        ownerKey,
        userId: actor.user?.id ?? null,
        total,
        usdTotal,
        status: "payment_pending",
        name,
        city,
        phone: input.phone?.trim() ?? "",
        address: input.address?.trim() ?? "",
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

      await manager.getRepository(CartItem).delete({ ownerKey });

      return {
        ...created,
        items,
        payment,
      };
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
    return this.toOrder(
      {
        ...order,
        payment: {
          provider,
          status: redirectUrl ? "redirected" : "created",
        },
      },
      redirectUrl,
    );
  }

  /**
   * Customer submits a transfer receipt. Order stays payment_pending until
   * an admin verifies and sets status to confirmed.
   */
  async confirmPayment(
    actor: Actor,
    id: string,
    input: { receiptImage?: string } = {},
  ) {
    const order = await this.ownedOrder(actor, id);
    const status = normalizeStoreOrderStatus(order.status);
    if (status !== "payment_pending") {
      throw new BadRequestException("این سفارش دیگر در انتظار پرداخت نیست.");
    }
    if (order.payment?.status === "submitted") {
      throw new BadRequestException("رسید این سفارش قبلاً ارسال شده و در انتظار تأیید است.");
    }

    const receiptImage = input.receiptImage?.trim();
    if (!receiptImage) {
      throw new BadRequestException("برای تأیید پرداخت، تصویر رسید را بارگذاری کنید.");
    }
    try {
      assertImageData(receiptImage, receiptImageLimit, receiptImageError);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : receiptImageError,
      );
    }

    const updated = await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(PaymentIntent).update(
        { orderId: order.id },
        {
          status: "submitted",
          receiptImage,
          submittedAt: new Date(),
        },
      );
      const next = await manager.getRepository(Order).findOneOrFail({
        where: { id: order.id },
        relations: { items: true, payment: true },
      });
      return next;
    });
    return this.toOrder(updated);
  }

  /** @deprecated Alias kept so existing clients keep working until renamed. */
  confirmDemoPayment(actor: Actor, id: string, input?: { receiptImage?: string }) {
    return this.confirmPayment(actor, id, input);
  }

  async cancel(actor: Actor, id: string) {
    const order = await this.ownedOrder(actor, id);
    const status = normalizeStoreOrderStatus(order.status);
    if (status !== "payment_pending") {
      throw new BadRequestException("فقط سفارش در انتظار پرداخت را می‌توان لغو کرد.");
    }

    const slugs = order.items.map((item) => item.productSlug);
    const updated = await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Product).update(
        { slug: In(slugs), status: "reserved" },
        { status: "available" },
      );
      await manager.getRepository(PaymentIntent).update(
        { orderId: order.id },
        { status: "failed" },
      );
      await manager.getRepository(Order).update({ id: order.id }, { status: "cancelled" });
      return manager.getRepository(Order).findOneOrFail({
        where: { id: order.id },
        relations: { items: true, payment: true },
      });
    });
    return this.toOrder(updated);
  }

  private async ownedOrder(actor: Actor, id: string) {
    const order = await this.orders.findOne({
      where: { id, ownerKey: this.identity.key(actor) },
      relations: { items: true, payment: true },
    });
    if (!order) throw new NotFoundException("سفارش پیدا نشد.");
    return order;
  }

  private toOrder(order: OrderRow, redirectUrl?: string) {
    const status = normalizeStoreOrderStatus(order.status);
    return {
      id: order.id,
      slugs: order.items.map((item) => item.productSlug),
      total: order.total,
      usdTotal: order.usdTotal,
      createdAt: order.createdAt.getTime(),
      status,
      delivery: {
        name: order.name,
        city: order.city,
        phone: order.phone,
        address: order.address,
      },
      trackingCode: order.trackingCode || undefined,
      estimatedDeliveryAt: order.estimatedDeliveryAt?.getTime() ?? undefined,
      payment: this.toPayment(order, status, redirectUrl),
    };
  }

  private toPayment(
    order: OrderRow,
    orderStatus: string,
    redirectUrl?: string,
  ): OrderPayment | undefined {
    if (!order.payment) return undefined;
    const provider = (order.payment.provider || paymentProvider()) as PaymentProvider;
    const mode = provider === "zarinpal" ? "gateway" : paymentMode();
    const payment: OrderPayment = {
      mode,
      provider,
      status: order.payment.status as OrderPayment["status"],
      receiptImage: order.payment.receiptImage || undefined,
      submittedAt: order.payment.submittedAt?.getTime(),
    };

    if (orderStatus === "payment_pending") {
      if (
        payment.status !== "submitted" &&
        (mode === "manual_card" ||
          provider === "manual_card" ||
          provider === "sandbox")
      ) {
        payment.mode = "manual_card";
        payment.manualCard = manualCardDetails();
      }
      if (redirectUrl) payment.redirectUrl = redirectUrl;
    }

    return payment;
  }
}
