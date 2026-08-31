import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdentityService } from "../common/identity.service";
import { productInclude, toProduct } from "../catalog/product.mapper";
import type { Actor } from "../common/identity";

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: IdentityService,
  ) {}

  async get(actor: Actor) {
    const items = await this.prisma.cartItem.findMany({
      where: { ownerKey: this.identity.key(actor) },
      include: { product: { include: productInclude } },
      orderBy: { createdAt: "asc" },
    });
    return {
      slugs: items.map((item) => item.productSlug),
      items: items.map((item) => toProduct(item.product)),
    };
  }

  async add(actor: Actor, slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product || product.status === "draft") {
      throw new NotFoundException("اثر پیدا نشد.");
    }
    if (product.status === "sold" || product.status === "reserved") {
      throw new ConflictException("این اثر دیگر قابل افزودن به سبد نیست.");
    }
    await this.prisma.cartItem.upsert({
      where: {
        ownerKey_productSlug: {
          ownerKey: this.identity.key(actor),
          productSlug: slug,
        },
      },
      update: {},
      create: { ownerKey: this.identity.key(actor), productSlug: slug },
    });
    return this.get(actor);
  }

  async remove(actor: Actor, slug: string) {
    await this.prisma.cartItem.deleteMany({
      where: { ownerKey: this.identity.key(actor), productSlug: slug },
    });
    return this.get(actor);
  }

  async clear(actor: Actor) {
    await this.prisma.cartItem.deleteMany({
      where: { ownerKey: this.identity.key(actor) },
    });
    return this.get(actor);
  }
}
