import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdentityService } from "../common/identity.service";
import type { Actor } from "../common/identity";

@Injectable()
export class NoticesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: IdentityService,
  ) {}

  async list(actor: Actor) {
    const notices = await this.prisma.notice.findMany({
      where: { ownerKey: this.identity.key(actor) },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return {
      notices: notices.map((notice) => ({
        id: notice.id,
        kind: notice.kind as "favorite" | "cart" | "welcome" | "order",
        productSlug: notice.productSlug ?? undefined,
        read: notice.read,
        createdAt: notice.createdAt.getTime(),
      })),
      unread: notices.filter((notice) => !notice.read).length,
    };
  }

  async create(
    actor: Actor,
    kind: "favorite" | "cart" | "welcome" | "order",
    productSlug?: string,
  ) {
    await this.prisma.notice.create({
      data: {
        ownerKey: this.identity.key(actor),
        kind,
        productSlug,
      },
    });
    return this.list(actor);
  }

  async markAllRead(actor: Actor) {
    await this.prisma.notice.updateMany({
      where: { ownerKey: this.identity.key(actor), read: false },
      data: { read: true },
    });
    return this.list(actor);
  }
}
