import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notice } from "../database/entities";
import { IdentityService } from "../common/identity.service";
import type { Actor } from "../common/identity";
import type { StoredNoticeKind } from "./notice-kinds";

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private readonly notices: Repository<Notice>,
    private readonly identity: IdentityService,
  ) {}

  async list(actor: Actor) {
    const notices = await this.notices.find({
      where: { ownerKey: this.identity.key(actor) },
      order: { createdAt: "DESC" },
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
      kind: notice.kind as StoredNoticeKind,
      productSlug: notice.productSlug ?? undefined,
      read: notice.read,
      createdAt: notice.createdAt.getTime(),
    };
  }

  async create(actor: Actor, kind: StoredNoticeKind, productSlug?: string) {
    return this.createForOwner(this.identity.key(actor), kind, productSlug);
  }

  async createForOwner(ownerKey: string, kind: StoredNoticeKind, productSlug?: string) {
    await this.notices.save(
      this.notices.create({
        ownerKey,
        kind,
        productSlug: productSlug ?? null,
      }),
    );
    const notices = await this.notices.find({
      where: { ownerKey },
      order: { createdAt: "DESC" },
      take: 20,
    });
    return {
      notices: notices.map((notice) => this.toNotice(notice)),
      unread: notices.filter((notice) => !notice.read).length,
    };
  }

  async markAllRead(actor: Actor) {
    await this.notices.update(
      { ownerKey: this.identity.key(actor), read: false },
      { read: true },
    );
    return this.list(actor);
  }
}
