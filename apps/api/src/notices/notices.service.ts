import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { isArtistNotice, shouldSkipDuplicateNotice } from "@rad/types";
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
    return this.snapshot(this.identity.key(actor));
  }

  private async snapshot(ownerKey: string) {
    const notices = await this.notices.find({
      where: { ownerKey },
      order: { createdAt: "DESC" },
      take: 50,
    });
    const visible = notices
      .filter((notice) => isArtistNotice(notice.kind))
      .slice(0, 20);
    return {
      notices: visible.map((notice) => this.toNotice(notice)),
      unread: visible.filter((notice) => !notice.read).length,
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

  /**
   * Public create is a no-op. Favorite, cart, and checkout notices are the
   * customer's own actions. Studio events go through `createForOwner`.
   */
  async create(actor: Actor, kind?: StoredNoticeKind, productSlug?: string) {
    void kind;
    void productSlug;
    return this.list(actor);
  }

  async createForOwner(
    ownerKey: string,
    kind: StoredNoticeKind,
    productSlug?: string,
  ) {
    if (!isArtistNotice(kind)) return this.snapshot(ownerKey);
    if (kind !== "commission_message") {
      const existing = await this.notices.findOne({
        where: {
          ownerKey,
          kind,
          read: false,
          productSlug: productSlug ? productSlug : IsNull(),
        },
      });
      if (shouldSkipDuplicateNotice(kind, Boolean(existing))) {
        return this.snapshot(ownerKey);
      }
    }
    await this.notices.save(
      this.notices.create({
        ownerKey,
        kind,
        productSlug: productSlug ?? null,
      }),
    );
    return this.snapshot(ownerKey);
  }

  async markAllRead(actor: Actor) {
    await this.notices.update(
      { ownerKey: this.identity.key(actor), read: false },
      { read: true },
    );
    return this.list(actor);
  }
}
