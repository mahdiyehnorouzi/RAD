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
      notices: notices.map((notice) => this.toNotice(notice)),
      unread: notices.filter((notice) => !notice.read).length,
    };
  }

  private toNotice(notice: {
    id: string;
    kind: string;
    productSlug: string | null;
    read: boolean;
    createdAt: Date;
  }) {
    return {
      id: notice.id,
      kind: notice.kind as
        | "favorite"
        | "cart"
        | "welcome"
        | "order"
        | "commission_approved"
        | "commission_declined"
        | "commission_change"
        | "commission_message",
      productSlug: notice.productSlug ?? undefined,
      read: notice.read,
      createdAt: notice.createdAt.getTime(),
    };
  }

  async create(
    actor: Actor,
    kind: "favorite" | "cart" | "welcome" | "order" | "commission_approved" | "commission_declined" | "commission_change" | "commission_message",
    productSlug?: string,
  ) {
    return this.createForOwner(this.identity.key(actor), kind, productSlug);
  }

  async createForOwner(
    ownerKey: string,
    kind: "favorite" | "cart" | "welcome" | "order" | "commission_approved" | "commission_declined" | "commission_change" | "commission_message",
    productSlug?: string,
  ) {
    await this.prisma.notice.create({
      data: {
        ownerKey,
        kind,
        productSlug,
      },
    });
    const notices = await this.prisma.notice.findMany({
      where: { ownerKey },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return {
      notices: notices.map((notice) => this.toNotice(notice)),
      unread: notices.filter((notice) => !notice.read).length,
    };
  }

  async markAllRead(actor: Actor) {
    await this.prisma.notice.updateMany({
      where: { ownerKey: this.identity.key(actor), read: false },
      data: { read: true },
    });
    return this.list(actor);
  }
}
