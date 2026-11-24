import { formatRadCode, radIdentityLabel, radPermanentUrl } from "@rad/types";
import type {
  PublicRadIdentity,
  RadIdentityBatchView,
  RadIdentityStatus,
  RadIdentitySummary,
  RadIdentityView,
} from "@rad/types";
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import {
  Product,
  RadIdentity,
  RadIdentityBatch,
  RadIdentityEvent,
} from "../database/entities";
import {
  assignNewNumberToExistingProduct,
  assignReservedIdentity,
  insertProductWithIdentity,
  reserveIdentityBatch,
  retireIdentitiesForProduct,
} from "./identity.allocator";
import {
  qrGeometry,
  type LegacyArtworkGap,
  type QrArtworkFile,
} from "./identity-print";
import { classifyLegacyArtwork } from "./legacy-artwork";

const STORY_PUBLISHED = new Set(["ready", "available", "sold", "archived"]);

@Injectable()
export class IdentitiesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(RadIdentity)
    private readonly identities: Repository<RadIdentity>,
    @InjectRepository(RadIdentityBatch)
    private readonly batches: Repository<RadIdentityBatch>,
    @InjectRepository(RadIdentityEvent)
    private readonly events: Repository<RadIdentityEvent>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  reserve(
    input: { quantity: number; idempotencyKey: string },
    createdById: string | null,
  ) {
    return reserveIdentityBatch(this.dataSource, { ...input, createdById });
  }

  insertProduct(
    fields: Parameters<typeof insertProductWithIdentity>[1],
    requestedRadNumber?: number | null,
  ) {
    return insertProductWithIdentity(
      this.dataSource,
      fields,
      requestedRadNumber,
    );
  }

  assign(identityId: string, productId: string) {
    return assignReservedIdentity(this.dataSource, identityId, productId);
  }

  assignFresh(productId: string) {
    return assignNewNumberToExistingProduct(this.dataSource, productId);
  }

  retireInManager(
    manager: Parameters<typeof retireIdentitiesForProduct>[0],
    productId: string,
  ) {
    return retireIdentitiesForProduct(manager, productId);
  }

  async summary(): Promise<RadIdentitySummary> {
    const [total, reserved, assigned, retired, printed] = await Promise.all([
      this.identities.count(),
      this.identities.count({ where: { status: "reserved" } }),
      this.identities.count({ where: { status: "assigned" } }),
      this.identities.count({ where: { status: "retired" } }),
      this.identities
        .createQueryBuilder("identity")
        .where(`identity."printedAt" IS NOT NULL`)
        .getCount(),
    ]);
    return {
      total,
      reserved,
      assigned,
      retired,
      printed,
      unassigned: reserved,
    };
  }

  async list(filter: {
    q?: string;
    status?: string;
    batchId?: string;
    assignment?: string;
  }) {
    const qb = this.identities
      .createQueryBuilder("identity")
      .leftJoin(Product, "product", `product.id = identity."productId"`)
      .orderBy("identity.radNumber", "ASC");
    if (
      filter.status === "reserved" ||
      filter.status === "assigned" ||
      filter.status === "retired"
    ) {
      qb.andWhere("identity.status = :status", { status: filter.status });
    }
    if (filter.batchId) {
      qb.andWhere(`identity."batchId" = :batchId`, { batchId: filter.batchId });
    }
    if (filter.assignment === "assigned") {
      qb.andWhere(`identity."productId" IS NOT NULL`);
    }
    if (filter.assignment === "unassigned") {
      qb.andWhere(`identity."productId" IS NULL`);
    }
    const query = filter.q?.trim();
    if (query) {
      qb.andWhere(
        `(CAST(identity."radNumber" AS text) LIKE :q OR product.name ILIKE :name)`,
        { q: `%${query.replace(/\D/g, "") || query}%`, name: `%${query}%` },
      );
    }
    const rows = await qb.getMany();
    const productIds = rows
      .map((row) => row.productId)
      .filter((id): id is string => Boolean(id));
    const products = productIds.length
      ? await this.products.find({ where: { id: In(productIds) } })
      : [];
    const byId = new Map(products.map((product) => [product.id, product]));
    return rows.map((identity) => {
      const product = identity.productId
        ? byId.get(identity.productId)
        : undefined;
      return this.toView(identity, {
        name: product?.name ?? null,
        slug: product?.slug ?? null,
      });
    });
  }

  async get(id: string) {
    const identity = await this.identities.findOne({ where: { id } });
    if (!identity) return null;
    const product = identity.productId
      ? await this.products.findOne({ where: { id: identity.productId } })
      : null;
    const events = await this.events.find({
      where: { identityId: id },
      order: { at: "ASC" },
    });
    return {
      ...this.toView(identity, {
        name: product?.name ?? null,
        slug: product?.slug ?? null,
      }),
      events: events.map((event) => ({
        kind: event.kind,
        at: event.at.getTime(),
        productId: event.productId,
        batchId: event.batchId,
      })),
    };
  }

  async batchRows(batchId: string) {
    const batch = await this.batches.findOne({ where: { id: batchId } });
    if (!batch) return null;
    const identities = await this.identities.find({
      where: { batchId },
      order: { radNumber: "ASC" },
    });
    const productIds = identities
      .map((identity) => identity.productId)
      .filter((id): id is string => Boolean(id));
    const products = productIds.length
      ? await this.products.find({ where: { id: In(productIds) } })
      : [];
    const byId = new Map(products.map((product) => [product.id, product]));
    return {
      batch,
      rows: identities.map((identity) => {
        const product = identity.productId
          ? byId.get(identity.productId)
          : undefined;
        return {
          radNumber: identity.radNumber,
          label: radIdentityLabel(identity.radNumber),
          url: radPermanentUrl(identity.radNumber),
          status: identity.status,
          productId: identity.productId,
          productName: product?.name ?? null,
          batchId,
          storyPublished: Boolean(
            product &&
            identity.status === "assigned" &&
            STORY_PUBLISHED.has(product.status),
          ),
        };
      }),
    };
  }

  /**
   * QR rows for products that already have a permanent number.
   * Reserved batch numbers are not included and nothing is allocated.
   */
  async legacyArtworkPlan(): Promise<{
    rows: QrArtworkFile[];
    inconsistencies: LegacyArtworkGap[];
    identityCount: number;
    reserved: number;
  }> {
    const products = await this.products
      .createQueryBuilder("product")
      .where(`product."radNumber" IS NOT NULL`)
      .orderBy(`product."radNumber"`, "ASC")
      .getMany();
    const identities = await this.identities.find();
    const rows: QrArtworkFile[] = [];
    const inconsistencies: LegacyArtworkGap[] = [];
    for (const product of products) {
      if (product.radNumber == null) continue;
      const decision = classifyLegacyArtwork({
        product: {
          id: product.id,
          name: product.name,
          status: product.status,
          radNumber: product.radNumber,
        },
        identities,
        resolvedProductId: await this.resolvedArtworkId(product.radNumber),
      });
      if (decision.gap) inconsistencies.push(decision.gap);
      if (decision.row) rows.push(decision.row);
    }
    return {
      rows,
      inconsistencies,
      identityCount: identities.length,
      reserved: identities.filter((row) => row.status === "reserved").length,
    };
  }

  async productQr(productId: string) {
    const product = await this.products.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException("محصول پیدا نشد.");
    if (product.radNumber == null) {
      throw new NotFoundException({
        message: "این اثر شماره رَد ندارد و شماره‌ای برایش ساخته نمی‌شود.",
        code: "rad_number_absent",
      });
    }
    const decision = classifyLegacyArtwork({
      product: {
        id: product.id,
        name: product.name,
        status: product.status,
        radNumber: product.radNumber,
      },
      identities: await this.identities.find(),
      resolvedProductId: await this.resolvedArtworkId(product.radNumber),
    });
    if (!decision.row) {
      const mismatch = decision.gap?.issue === "identity_mismatch";
      throw new ConflictException({
        message: mismatch
          ? "شماره اثر با شناسه دائمی یکی نیست. QR ساخته نمی‌شود."
          : "آدرس دائمی این شماره به همین اثر نمی‌رسد. QR ساخته نمی‌شود.",
        code: decision.gap?.issue ?? "url_not_this_artwork",
        inconsistencies: decision.gap ? [decision.gap] : [],
      });
    }
    return {
      url: decision.row.url,
      label: decision.row.label,
      radNumber: decision.row.radNumber,
    };
  }

  /**
   * Product behind the public `/r/NNN` route. A reserved or retired number
   * does not resolve to an artwork, even if a product still stores that number.
   */
  private async resolvedArtworkId(radNumber: number): Promise<string | null> {
    const resolved = await this.resolvePublic(formatRadCode(radNumber));
    if (
      !resolved ||
      resolved.status !== "assigned" ||
      resolved.radNumber !== radNumber
    ) {
      return null;
    }
    const holder = await this.identities.findOne({ where: { radNumber } });
    if (holder) {
      if (holder.status !== "assigned" || !holder.productId) return null;
      const product = await this.products.findOne({
        where: { id: holder.productId, radNumber },
      });
      return product?.id ?? null;
    }
    const product = await this.products.findOne({ where: { radNumber } });
    return product?.id ?? null;
  }

  async listBatches(): Promise<RadIdentityBatchView[]> {
    const batches = await this.batches.find({ order: { createdAt: "DESC" } });
    return batches.map((batch) => this.toBatch(batch));
  }

  toBatch(batch: RadIdentityBatch, replayed?: boolean): RadIdentityBatchView {
    return {
      id: batch.id,
      idempotencyKey: batch.idempotencyKey,
      quantity: batch.quantity,
      startNumber: batch.startNumber,
      endNumber: batch.endNumber,
      startCode: formatRadCode(batch.startNumber),
      endCode: formatRadCode(batch.endNumber),
      printedAt: batch.printedAt?.getTime() ?? null,
      createdAt: batch.createdAt.getTime(),
      ...(replayed === undefined ? {} : { replayed }),
    };
  }

  async resolvePublic(code: string): Promise<PublicRadIdentity | null> {
    if (!/^\d+$/.test(code)) return null;
    const radNumber = Number(code);
    if (!Number.isInteger(radNumber) || radNumber < 1) return null;
    const identity = await this.identities.findOne({ where: { radNumber } });
    const product = identity?.productId
      ? await this.products.findOne({ where: { id: identity.productId } })
      : identity
        ? null
        : await this.products.findOne({ where: { radNumber } });
    if (!identity && !product) return null;
    const status: RadIdentityStatus = identity?.status ?? "assigned";
    const storyPublished = Boolean(
      product &&
        product.radNumber === radNumber &&
        status === "assigned" &&
        STORY_PUBLISHED.has(product.status),
    );
    const padded = formatRadCode(radNumber);
    return {
      radNumber,
      code: padded,
      status,
      storyPublished,
      passportPath: storyPublished ? `/passport/${padded}` : null,
    };
  }

  private toView(
    identity: RadIdentity,
    product: { name: string | null; slug: string | null },
  ): RadIdentityView {
    const url = radPermanentUrl(identity.radNumber);
    const { dimension, d } = qrGeometry(url);
    return {
      id: identity.id,
      radNumber: identity.radNumber,
      code: formatRadCode(identity.radNumber),
      label: radIdentityLabel(identity.radNumber),
      status: identity.status,
      printed: identity.printedAt != null,
      batchId: identity.batchId,
      productId: identity.productId,
      productName: product.name,
      productSlug: product.slug,
      createdAt: identity.createdAt.getTime(),
      reservedAt: identity.reservedAt.getTime(),
      assignedAt: identity.assignedAt?.getTime() ?? null,
      printedAt: identity.printedAt?.getTime() ?? null,
      permanentUrl: url,
      qr: { size: dimension, d },
    };
  }
}
