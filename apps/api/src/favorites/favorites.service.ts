import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdentityService } from "../common/identity.service";
import type { Actor } from "../common/identity";

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: IdentityService,
  ) {}

  async list(actor: Actor) {
    const rows = await this.prisma.favorite.findMany({
      where: { ownerKey: this.identity.key(actor) },
      orderBy: { createdAt: "desc" },
    });
    return { slugs: rows.map((row) => row.productSlug) };
  }

  async toggle(actor: Actor, slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product || product.status === "draft") {
      throw new NotFoundException("اثر پیدا نشد.");
    }
    const ownerKey = this.identity.key(actor);
    const existing = await this.prisma.favorite.findUnique({
      where: { ownerKey_productSlug: { ownerKey, productSlug: slug } },
    });
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { ...((await this.list(actor))), added: false };
    }
    await this.prisma.favorite.create({ data: { ownerKey, productSlug: slug } });
    return { ...((await this.list(actor))), added: true };
  }
}
