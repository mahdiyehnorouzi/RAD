import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdentityService } from "../common/identity.service";
import { NoticesService } from "../notices/notices.service";
import type { Actor } from "../common/identity";
import {
  normalizeStoreOrderStatus,
} from "./store-order-status";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: IdentityService,
    private readonly notices: NoticesService,
  ) {}

  async list(actor: Actor) {
    const orders = await this.prisma.order.findMany({
      where: { ownerKey: this.identity.key(actor) },
      include: { items: true },
      orderBy: { createdAt: "desc" },
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
    const cart = await this.prisma.cartItem.findMany({
      where: { ownerKey },
      include: { product: true },
    });
    if (!cart.length) throw new BadRequestException("سبد خرید خالی است.");

    const name = input.name?.trim() || actor.user?.name || "کاربر رَد";
    const city = input.city?.trim() || "تهران";
    const slugs = cart.map((item) => item.productSlug);

    const order = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { slug: { in: slugs } },
      });
      if (products.length !== slugs.length) {
        throw new BadRequestException("یکی از آثار سبد دیگر موجود نیست.");
      }
      for (const product of products) {
        if (product.status !== "available") {
          throw new ConflictException(`اثر «${product.name}» دیگر قابل خرید نیست.`);
        }
      }

      await tx.product.updateMany({
        where: { slug: { in: slugs } },
        data: { status: "reserved" },
      });

      const total = products.reduce((sum, product) => sum + product.tomanPrice, 0);
      const usdTotal = products.reduce((sum, product) => sum + product.usdPrice, 0);
      const id = `RAD-${Date.now().toString().slice(-6)}`;

      const created = await tx.order.create({
        data: {
          id,
          ownerKey,
          userId: actor.user?.id,
          total,
          usdTotal,
          status: "payment_pending",
          name,
          city,
          phone: input.phone?.trim() ?? "",
          address: input.address?.trim() ?? "",
          items: { create: slugs.map((productSlug) => ({ productSlug })) },
          payment: {
            create: {
              amount: total,
              currency: "IRR",
              provider: "sandbox",
              status: "created",
            },
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { ownerKey } });
      return created;
    });

    await this.notices.create(actor, "order", slugs[0]);
    return this.toOrder(order);
  }

  async confirmDemoPayment(actor: Actor, id: string) {
    const order = await this.ownedOrder(actor, id);
    const status = normalizeStoreOrderStatus(order.status);
    if (status !== "payment_pending") {
      throw new BadRequestException("این سفارش دیگر در انتظار پرداخت نیست.");
    }

    const slugs = order.items.map((item) => item.productSlug);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { slug: { in: slugs } },
        data: { status: "sold" },
      });
      await tx.paymentIntent.updateMany({
        where: { orderId: order.id },
        data: { status: "verified" },
      });
      return tx.order.update({
        where: { id: order.id },
        data: {
          status: "confirmed",
          estimatedDeliveryAt: this.estimateDelivery(order.city),
        },
        include: { items: true },
      });
    });
    return this.toOrder(updated);
  }

  async cancel(actor: Actor, id: string) {
    const order = await this.ownedOrder(actor, id);
    const status = normalizeStoreOrderStatus(order.status);
    if (status !== "payment_pending") {
      throw new BadRequestException("فقط سفارش در انتظار پرداخت را می‌توان لغو کرد.");
    }

    const slugs = order.items.map((item) => item.productSlug);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { slug: { in: slugs }, status: "reserved" },
        data: { status: "available" },
      });
      await tx.paymentIntent.updateMany({
        where: { orderId: order.id },
        data: { status: "failed" },
      });
      return tx.order.update({
        where: { id: order.id },
        data: { status: "cancelled" },
        include: { items: true },
      });
    });
    return this.toOrder(updated);
  }

  private async ownedOrder(actor: Actor, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, ownerKey: this.identity.key(actor) },
      include: { items: true },
    });
    if (!order) throw new NotFoundException("سفارش پیدا نشد.");
    return order;
  }

  private estimateDelivery(city: string) {
    const tehran = city.includes("تهران") || /tehran/i.test(city);
    const days = tehran ? 4 : 8;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private toOrder(order: {
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
  }) {
    return {
      id: order.id,
      slugs: order.items.map((item) => item.productSlug),
      total: order.total,
      usdTotal: order.usdTotal,
      createdAt: order.createdAt.getTime(),
      status: normalizeStoreOrderStatus(order.status),
      delivery: {
        name: order.name,
        city: order.city,
        phone: order.phone,
        address: order.address,
      },
      trackingCode: order.trackingCode || undefined,
      estimatedDeliveryAt: order.estimatedDeliveryAt?.getTime() ?? undefined,
    };
  }
}

