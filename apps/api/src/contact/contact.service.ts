import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ContactMessage, Order } from "../database/entities";
import { IdentityService } from "../common/identity.service";
import type { Actor } from "../common/identity";
import { toAdminContactMessage } from "./contact.mapper";
import { migrateContactMessageThreads } from "./contact-message-thread.migration";
import { normalizeOrderReference } from "./order-reference";
import type { CreateContactMessageDto } from "./dto";
import type { ContactMessageStatus } from "./type";

@Injectable()
export class ContactService implements OnModuleInit {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ContactMessage)
    private readonly messages: Repository<ContactMessage>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly identity: IdentityService,
  ) {}

  async onModuleInit() {
    try {
      await migrateContactMessageThreads(this.dataSource, this.logger);
    } catch (error) {
      this.logger.warn(
        `ContactMessage thread columns skipped (will retry on next boot): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Saves a visitor's message for the admin inbox. An order number links it
   * to that order so staff read payment questions beside the receipt.
   */
  async create(actor: Actor, input: CreateContactMessageDto) {
    const ownerKey = this.identity.key(actor);
    const body = input.body.trim();
    if (body.length < 3) {
      throw new BadRequestException("پیامت خالی مانده؛ چند کلمه بنویس.");
    }

    const orderId = normalizeOrderReference(input.orderId);
    const order = orderId
      ? await this.orders.findOne({
          where: { id: orderId },
          select: { id: true, ownerKey: true, name: true, phone: true },
        })
      : null;
    if (orderId && !order) {
      throw new BadRequestException(
        "سفارشی با این شماره پیدا نشد؛ شماره را از صفحه‌ی سفارش کپی کن.",
      );
    }
    const fromOrderOwner = Boolean(order && order.ownerKey === ownerKey);

    const contact =
      input.contact?.trim() ||
      actor.user?.email ||
      (fromOrderOwner ? order?.phone : "") ||
      "";
    if (!contact) {
      throw new BadRequestException(
        "یک ایمیل یا شماره تماس بنویس تا بتوانیم جوابت را بدهیم.",
      );
    }

    const saved = await this.messages.save(
      this.messages.create({
        ownerKey,
        userId: actor.user?.id ?? null,
        orderId: order?.id ?? null,
        fromOrderOwner,
        topic: input.topic,
        source: input.source,
        name: actor.user?.name ?? (fromOrderOwner ? order?.name : "") ?? "",
        contact,
        body,
        status: "new",
        parentId: null,
        fromAdmin: false,
      }),
    );
    return {
      id: saved.id,
      createdAt: saved.createdAt.getTime(),
      orderId: saved.orderId ?? undefined,
    };
  }

  async listAll() {
    const messages = await this.messages.find({
      order: { createdAt: "DESC" },
      take: 500,
    });
    return messages.map(toAdminContactMessage);
  }

  async setStatus(id: string, status: ContactMessageStatus) {
    const message = await this.messages.findOne({ where: { id } });
    if (!message) throw new NotFoundException("پیام پیدا نشد.");
    await this.messages.update(
      { id },
      { status, resolvedAt: status === "resolved" ? new Date() : null },
    );
    return toAdminContactMessage(
      await this.messages.findOneOrFail({ where: { id } }),
    );
  }

  /**
   * A thread is flat: `rootId` identifies the original message, and every
   * reply (admin or customer) stores `parentId = rootId`, never chaining
   * deeper. Used by both the admin reply endpoint and the customer one.
   */
  private async findRoot(rootId: string) {
    const root = await this.messages.findOne({ where: { id: rootId } });
    if (!root) throw new NotFoundException("پیام پیدا نشد.");
    if (root.parentId) {
      // A reply id was passed instead of the thread root — resolve to the
      // actual root so every reply in a thread always points at the same row.
      const actualRoot = await this.messages.findOne({
        where: { id: root.parentId },
      });
      if (!actualRoot) throw new NotFoundException("پیام پیدا نشد.");
      return actualRoot;
    }
    return root;
  }

  /** Staff reply — no ownership check, gated by AdminGuard on the route. */
  async replyAsAdmin(rootId: string, body: string) {
    const root = await this.findRoot(rootId);
    const trimmed = body.trim();
    if (trimmed.length < 1) {
      throw new BadRequestException("متن پیام را وارد کنید.");
    }
    await this.messages.save(
      this.messages.create({
        ownerKey: root.ownerKey,
        userId: null,
        orderId: root.orderId,
        fromOrderOwner: root.fromOrderOwner,
        topic: root.topic,
        source: root.source,
        name: "دفتر کوره",
        contact: root.contact,
        body: trimmed,
        status: "new",
        parentId: root.id,
        fromAdmin: true,
      }),
    );
    // Re-open the thread for staff triage if the customer's reply arrives
    // after it was marked resolved; the inverse (admin replying) is handled
    // explicitly by whoever calls this — see admin.controller.ts.
    return this.listThread(root.id);
  }

  /** Customer reply — only the thread's original owner may post into it. */
  async replyAsCustomer(actor: Actor, rootId: string, body: string) {
    const root = await this.findRoot(rootId);
    const ownerKey = this.identity.key(actor);
    if (root.ownerKey !== ownerKey) {
      throw new ForbiddenException("این گفت‌وگو متعلق به شما نیست.");
    }
    const trimmed = body.trim();
    if (trimmed.length < 3) {
      throw new BadRequestException("پیامت خالی مانده؛ چند کلمه بنویس.");
    }
    await this.messages.save(
      this.messages.create({
        ownerKey: root.ownerKey,
        userId: actor.user?.id ?? null,
        orderId: root.orderId,
        fromOrderOwner: root.fromOrderOwner,
        topic: root.topic,
        source: root.source,
        name: root.name,
        contact: root.contact,
        body: trimmed,
        status: "new",
        parentId: root.id,
        fromAdmin: false,
      }),
    );
    return this.listThread(root.id);
  }

  /** Root message plus every reply, oldest first. */
  async listThread(rootId: string) {
    const rows = await this.messages.find({
      where: [{ id: rootId }, { parentId: rootId }],
      order: { createdAt: "ASC" },
    });
    return rows.map(toAdminContactMessage);
  }

  /** Every thread (by root id) tied to an order, for the customer's own order page. */
  async listThreadsForOrder(actor: Actor, orderId: string) {
    const order = await this.orders.findOne({
      where: { id: orderId },
      select: { id: true, ownerKey: true },
    });
    const ownerKey = this.identity.key(actor);
    if (!order || order.ownerKey !== ownerKey) {
      throw new ForbiddenException("این سفارش متعلق به شما نیست.");
    }
    const rows = await this.messages.find({
      where: { orderId },
      order: { createdAt: "ASC" },
    });
    return rows.map(toAdminContactMessage);
  }
}
