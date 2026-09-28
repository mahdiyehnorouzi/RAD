import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ContactMessage, Order } from "../database/entities";
import { IdentityService } from "../common/identity.service";
import type { Actor } from "../common/identity";
import { toAdminContactMessage } from "./contact.mapper";
import { normalizeOrderReference } from "./order-reference";
import type { CreateContactMessageDto } from "./dto";
import type { ContactMessageStatus } from "./type";

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly messages: Repository<ContactMessage>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly identity: IdentityService,
  ) {}

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
}
