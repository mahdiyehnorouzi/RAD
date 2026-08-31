import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdentityService } from "../common/identity.service";
import { NoticesService } from "../notices/notices.service";
import type { Actor } from "../common/identity";

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
          status: "received",
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
              status: "verified",
            },
          },
        },
        include: { items: true },
      });

      await tx.product.updateMany({
        where: { slug: { in: slugs } },
        data: { status: "sold" },
      });
      await tx.cartItem.deleteMany({ where: { ownerKey } });
      return created;
    });

    await this.notices.create(actor, "order");
    return this.toOrder(order);
  }

  private toOrder(order: {
    id: string;
    total: number;
    usdTotal: number;
    createdAt: Date;
    status: string;
    name: string;
    city: string;
    items: Array<{ productSlug: string }>;
  }) {
    return {
      id: order.id,
      slugs: order.items.map((item) => item.productSlug),
      total: order.total,
      usdTotal: order.usdTotal,
      createdAt: order.createdAt.getTime(),
      status: order.status,
      delivery: { name: order.name, city: order.city },
    };
  }
}
