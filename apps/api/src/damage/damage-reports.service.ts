import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { DamageReport, Order } from "../database/entities";
import { IdentityService } from "../common/identity.service";
import type { Actor } from "../common/identity";
import { assertImageData } from "../common/image-data";
import { normalizeOrderReference } from "../contact/order-reference";
import { normalizeStoreOrderStatus } from "../orders/store-order-status";
import {
  DAMAGE_OPEN_STATUSES,
  DAMAGE_PHOTO_ERROR,
  DAMAGE_PHOTO_LIMIT,
  DAMAGE_REPORTABLE_ORDER_STATUSES,
  DAMAGE_REPORT_WINDOW_HOURS,
} from "./const";
import {
  toAdminDamageReport,
  toCustomerDamageReport,
} from "./damage-report.mapper";
import type { CreateDamageReportDto, ReviewDamageReportDto } from "./dto";

const HOUR = 60 * 60 * 1000;

@Injectable()
export class DamageReportsService {
  constructor(
    @InjectRepository(DamageReport)
    private readonly reports: Repository<DamageReport>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly identity: IdentityService,
  ) {}

  /**
   * Files a transit-damage claim on the buyer's own shipped order. A late
   * report is still accepted and flagged so staff decide case by case.
   */
  async create(actor: Actor, input: CreateDamageReportDto) {
    const ownerKey = this.identity.key(actor);
    const orderId = normalizeOrderReference(input.orderId);
    const order = orderId
      ? await this.orders.findOne({ where: { id: orderId, ownerKey } })
      : null;
    if (!order) {
      throw new NotFoundException(
        "این سفارش در حساب تو پیدا نشد؛ با همان حسابی وارد شو که با آن خرید کردی.",
      );
    }
    const status = normalizeStoreOrderStatus(order.status);
    if (!(DAMAGE_REPORTABLE_ORDER_STATUSES as readonly string[]).includes(status)) {
      throw new BadRequestException(
        "گزارش آسیب بعد از تحویل اثر به پست ثبت می‌شود.",
      );
    }
    const open = await this.reports.findOne({
      where: { orderId: order.id, status: In([...DAMAGE_OPEN_STATUSES]) },
      select: { id: true },
    });
    if (open) {
      throw new ConflictException(
        "برای این سفارش یک گزارش باز داری؛ نتیجه‌اش را در همین صفحه می‌بینی.",
      );
    }

    for (const photo of [input.packagingPhoto, input.damagePhoto]) {
      try {
        assertImageData(photo?.trim() ?? "", DAMAGE_PHOTO_LIMIT, DAMAGE_PHOTO_ERROR);
      } catch {
        throw new BadRequestException(DAMAGE_PHOTO_ERROR);
      }
    }
    const body = input.body.trim();
    if (body.length < 3) {
      throw new BadRequestException("چند کلمه بنویس که چه آسیبی دیده‌ای.");
    }

    const late = Boolean(
      order.deliveredAt &&
        Date.now() > order.deliveredAt.getTime() + DAMAGE_REPORT_WINDOW_HOURS * HOUR,
    );
    const saved = await this.reports.save(
      this.reports.create({
        orderId: order.id,
        ownerKey,
        userId: actor.user?.id ?? null,
        packagingPhoto: input.packagingPhoto.trim(),
        damagePhoto: input.damagePhoto.trim(),
        body,
        status: "submitted",
        late,
      }),
    );
    return toCustomerDamageReport(saved);
  }

  async listMine(actor: Actor, orderId?: string) {
    const ownerKey = this.identity.key(actor);
    const id = normalizeOrderReference(orderId);
    const reports = await this.reports.find({
      where: id ? { ownerKey, orderId: id } : { ownerKey },
      order: { createdAt: "DESC" },
      take: 50,
    });
    return reports.map(toCustomerDamageReport);
  }

  async listAll() {
    const reports = await this.reports.find({
      order: { createdAt: "DESC" },
      take: 300,
    });
    const orders = await this.ordersFor(reports.map((report) => report.orderId));
    return reports.map((report) =>
      toAdminDamageReport(report, orders.get(report.orderId)),
    );
  }

  async review(id: string, input: ReviewDamageReportDto, staffId: string | null) {
    const report = await this.reports.findOne({ where: { id } });
    if (!report) throw new NotFoundException("گزارش پیدا نشد.");
    const note = input.note?.trim() || null;
    if (input.status === "approved" && !input.resolution) {
      throw new BadRequestException(
        "برای تأیید، روش جبران (مرمت یا بازگشت وجه) را انتخاب کن.",
      );
    }
    if (input.status === "declined" && !note) {
      throw new BadRequestException(
        "دلیل رد گزارش را برای مشتری بنویس.",
      );
    }
    const decided = input.status === "approved" || input.status === "declined";
    await this.reports.update(
      { id },
      {
        status: input.status,
        resolution: input.status === "approved" ? input.resolution : null,
        note,
        reviewedAt: decided ? new Date() : null,
        reviewedBy: decided ? staffId : null,
      },
    );
    const updated = await this.reports.findOneOrFail({ where: { id } });
    const orders = await this.ordersFor([updated.orderId]);
    return toAdminDamageReport(updated, orders.get(updated.orderId));
  }

  private async ordersFor(ids: string[]) {
    const unique = [...new Set(ids)];
    if (!unique.length) return new Map<string, Order>();
    const rows = await this.orders.find({
      where: { id: In(unique) },
      select: { id: true, name: true, phone: true, deliveredAt: true },
    });
    return new Map(rows.map((order) => [order.id, order]));
  }
}
