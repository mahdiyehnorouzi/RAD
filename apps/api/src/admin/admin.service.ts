import { MEDIA_MIMES, validateMediaSize } from "../storage/media-policy";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import {
  DataSource,
  In,
  IsNull,
  Not,
  QueryFailedError,
  Repository,
} from "typeorm";
import { generateVerificationCode } from "../auth/reset-token.util";
import { MailService } from "../mail/mail.service";
import {
  assertImageData,
  productImageError,
  productImageLimit,
} from "../common/image-data";
import {
  isValidProductImagePublicId,
  productImageFolder,
} from "../storage/cloudinary-storage.service";
import {
  checkIssuedUpload,
  recordIssuedUpload,
} from "../storage/upload-intent";
import {
  MEDIA_STORAGE,
  MEDIA_STORAGE_RESOLVER,
  isRemoteMediaStorage,
  isVideoStorage,
  type MediaStorageResolver,
  type MediaStorageService,
} from "../storage/media-storage.interface";
import type { AdminProductImageInputDto } from "./dto";
import {
  CartItem,
  Favorite,
  Order,
  PasswordResetToken,
  PaymentIntent,
  Product,
  ProductImage,
  Review,
  User,
  Vendor,
} from "../database/entities";
import type { ProductImageStorage } from "../database/entities/product-image.entity";
import { productIncludeWithSrc } from "../catalog/product.mapper";
import { nextRadNumber } from "../catalog/rad-number";
import { CatalogRevalidationService } from "../catalog/catalog-revalidation.service";
import { InventoryService } from "../inventory/inventory.service";
import type { ProductStatus } from "../inventory/type";
import { PaymentReviewService } from "../orders/payment-review.service";
import { OrdersService } from "../orders/orders.service";
import { ProductAttributesService } from "../product-attributes/product-attributes.service";
import {
  canManuallyTransitionOrder,
  normalizeStoreOrderStatus,
} from "../orders/store-order-status";
import { adminOrderRelations } from "./const/order-relations";
import { canAdmin, type AdminPermission } from "./permissions";
import {
  artistVendorId,
  toAdminMember,
  toAdminOrder,
  toAdminProduct,
  toAdminUser,
  toStoreCategory,
} from "./admin.mapper";
import type {
  InviteMemberDto,
  SaveProductDto,
  UpdateMemberDto,
  UpdateOrderDto,
} from "./dto";

/** Invitations get a longer window than a password-reset code (15 min) since the invitee may not act right away. */
const INVITE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

@Injectable()
export class AdminService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImages: Repository<ProductImage>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Vendor)
    private readonly vendors: Repository<Vendor>,
    @InjectRepository(CartItem)
    private readonly cartItems: Repository<CartItem>,
    @InjectRepository(Favorite)
    private readonly favorites: Repository<Favorite>,
    @InjectRepository(Review)
    private readonly reviews: Repository<Review>,
    @InjectRepository(PaymentIntent)
    private readonly payments: Repository<PaymentIntent>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokens: Repository<PasswordResetToken>,
    private readonly inventory: InventoryService,
    private readonly paymentReview: PaymentReviewService,
    private readonly ordersService: OrdersService,
    private readonly productAttributes: ProductAttributesService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorageService,
    @Inject(MEDIA_STORAGE_RESOLVER)
    private readonly storageFor: MediaStorageResolver,
    private readonly mail: MailService,
    private readonly catalogRevalidation: CatalogRevalidationService,
  ) {}

  private readonly logger = new Logger(AdminService.name);

  /** Whether SeaweedFS is the currently-active provider — reference equality against the resolver's own instance, not a config re-read. */
  private isSeaweedfsActive(): boolean {
    return this.storageFor("seaweedfs") === this.storage;
  }

  /**
   * Ownership check for a remote-media `objectKey` being attached to the
   * product identified by `slug`. Namespace shape
   * (`isValidProductImagePublicId`) is always checked first.
   *
   * For Cloudinary, that namespace check plus Cloudinary's own
   * account-level existence check (`verifyMedia`, called by every
   * caller right after this) remains the accepted model — unchanged
   * from before this fix, since Cloudinary mints its own `public_id`
   * client-side and this API never gets a chance to record an upload
   * intent before the fact.
   *
   * For SeaweedFS, namespace shape alone is NOT treated as sufficient
   * (see `upload-intent.ts`'s module doc for the full reasoning):
   * ownership is proven by exactly one of two things —
   *  1. DURABLE: this `objectKey` is ALREADY a persisted `ProductImage`
   *     row for THIS SAME product. A real Postgres row, survives
   *     restarts, shared across every process. If the row exists for a
   *     DIFFERENT product, this is a bid to claim already-consumed
   *     media and is rejected outright.
   *  2. FAIL-CLOSED, in-memory: for an objectKey with no existing row
   *     anywhere (a genuinely new attachment), this process must have
   *     a matching record of having minted it itself
   *     (`checkIssuedUpload`). Both "unknown" and "mismatch" are hard
   *     rejections — there is no fallback to namespace shape alone.
   */
  private async authorizeRemoteObjectKey(
    slug: string,
    productId: string | null,
    objectKey: string | undefined,
    kind: "image" | "video",
    isSeaweedfs: boolean,
  ) {
    if (
      !objectKey ||
      !isValidProductImagePublicId(productId ?? "unsaved", objectKey)
    ) {
      throw new BadRequestException("شناسه فایل نامعتبر است.");
    }
    if (!isSeaweedfs) return;

    const existingRow = await this.productImages.findOne({
      where: { objectKey },
    });
    if (existingRow) {
      if (existingRow.productSlug !== slug) {
        throw new BadRequestException(
          "این تصویر قبلاً به اثر دیگری متصل شده است.",
        );
      }
      return; // already ours — durable DB row is the proof, no intent needed
    }
    const intentCheck = checkIssuedUpload(objectKey, productId, kind);
    if (intentCheck !== "match") {
      this.logger.warn(
        `Rejected unauthorized object key attachment (${intentCheck}): ${objectKey}`,
      );
      throw new BadRequestException({
        code: "upload_intent_expired",
        message:
          "نشست بارگذاری این فایل منقضی شده یا نامعتبر است. لطفاً فایل را دوباره بارگذاری کنید.",
      });
    }
  }

  /**
   * Issues signed Cloudinary upload params for a new admin image upload.
   * The destination folder is derived here, server-side — never from
   * anything client-supplied — so `replaceImages` can later trust a
   * `public_id` that matches the expected namespace
   * (`isValidProductImagePublicId`). `CLOUDINARY_API_SECRET` never leaves
   * this process; only the signature + public params are returned.
   *
   * `slug` here is only a route param for admin UX (the dialog calls this
   * before a product may even exist, e.g. with a draft/placeholder slug);
   * it is never trusted for the folder itself. We re-resolve it to the
   * real, current `Product.id` with a fresh DB read every call — never a
   * client-cached id — and namespace by that `id`, which is immutable. If
   * no product exists yet for this slug (new-product flow, image attached
   * before the first save), the folder falls back to the unassociated
   * `rad/pending` namespace; `replaceImages` accepts that pattern for any
   * product at save time (see `cloudinary-storage.service.ts` for why no
   * migration step is needed when that image is later attached).
   */
  async signProductImageUpload(slug: string, mime: string, size?: number) {
    if (!(MEDIA_MIMES as readonly string[]).includes(mime)) {
      throw new BadRequestException(productImageError);
    }
    const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    const existing = await this.products.findOne({
      where: { slug: normalizedSlug },
    });
    const productId = existing?.id ?? null;
    const folder = productImageFolder(productId);
    const kind = mime.startsWith("video/") ? "video" : "image";
    if (size !== undefined) validateMediaSize(size, kind);
    const signed = await this.storage.createSignedUpload(
      folder,
      kind,
      size !== undefined,
    );
    if (this.isSeaweedfsActive()) {
      // Records that THIS process minted this key for this product (or
      // the shared pending namespace) — the proof
      // `authorizeRemoteObjectKey` requires for a genuinely new
      // SeaweedFS attachment. Cloudinary mints its own key client-side,
      // so there is nothing to record for that branch.
      const { objectKey } = signed as { objectKey: string };
      recordIssuedUpload(objectKey, productId, kind);
    }
    return signed;
  }

  async verifyProductMedia(
    slug: string,
    objectKey: string,
    kind: "image" | "video",
  ) {
    const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    const product = await this.products.findOne({
      where: { slug: normalizedSlug },
    });
    await this.authorizeRemoteObjectKey(
      normalizedSlug,
      product?.id ?? null,
      objectKey,
      kind,
      this.isSeaweedfsActive(),
    );
    return this.storage.verifyMedia(objectKey, kind);
  }

  assert(role: string | undefined, permission: AdminPermission) {
    if (!canAdmin(role, permission)) {
      throw new ForbiddenException("برای این عملیات دسترسی ندارید.");
    }
  }

  async listProducts() {
    await this.inventory.releaseExpiredHolds();
    const products = await this.products.find({
      relations: productIncludeWithSrc,
      order: { sortOrder: "ASC", updatedAt: "DESC" },
    });
    const valuesByProduct = new Map(
      await this.productAttributes.valuesForProducts(
        products.map((product) => product.id),
      ),
    );
    return products.map((product) =>
      toAdminProduct(product, valuesByProduct.get(product.id) ?? {}),
    );
  }

  async saveProduct(input: SaveProductDto, existingId?: string) {
    const slug = input.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const duplicate = await this.products.findOne({ where: { slug } });
    if (duplicate && duplicate.id !== existingId) {
      throw new ConflictException("این شناسه URL قبلاً استفاده شده است.");
    }

    if (!input.images.some((image) => !isVideoStorage(image.storage)))
      throw new BadRequestException("حداقل یک تصویر برای اثر لازم است.");
    // Validate before any product/vendor writes. Existing legacy references remain compatible.
    for (const image of input.images) {
      if (isRemoteMediaStorage(image.storage)) {
        const imageKind = isVideoStorage(image.storage) ? "video" : "image";
        await this.authorizeRemoteObjectKey(
          slug,
          duplicate?.id ?? null,
          image.objectKey,
          imageKind,
          image.storage === "seaweedfs" || image.storage === "seaweedfs_video",
        );
        await this.storageFor(image.storage).verifyMedia(
          image.objectKey as string,
          imageKind,
        );
      } else if (image.storage === "legacy_base64") {
        try {
          assertImageData(
            image.src ?? "",
            productImageLimit,
            productImageError,
          );
        } catch {
          throw new BadRequestException(productImageError);
        }
      } else if (!image.src) throw new BadRequestException(productImageError);
    }
    const vendorId = await this.ensureVendor(input.artist);
    const usdPrice = Math.max(1, Math.round(input.price / 85_000));
    const category = toStoreCategory(input.category);
    const details = ["تنها یک نسخه"];
    // Used only for a brand-new product (no existing value to preserve):
    // an explicit `subtitle` if admin set one, else the historical default
    // (the description's first 48 characters). An update must never
    // re-derive this default from a new description — see the `subtitle`
    // passed to `updateProduct` below, which stays undefined (leaving the
    // column untouched) unless admin explicitly set a value.
    const subtitle =
      input.subtitle?.trim() || input.description.trim().slice(0, 48);
    const en = {
      name: input.name,
      subtitle,
      story: input.description,
      details: ["One of one"],
    };

    const product = existingId
      ? await this.updateProduct(existingId, {
          slug,
          name: input.name.trim(),
          tomanPrice: input.price,
          usdPrice,
          category,
          status: input.status,
          story: input.description.trim(),
          // undefined (admin didn't set one) leaves the column untouched.
          subtitle: input.subtitle?.trim() || undefined,
          vendorId,
        })
      : await this.createProductWithRadNumber({
          slug,
          name: input.name.trim(),
          subtitle,
          tomanPrice: input.price,
          usdPrice,
          color: "#8a4938",
          accent: "#ead9bd",
          shape: "tall",
          category,
          status: input.status,
          story: input.description.trim(),
          details,
          en,
          vendorId,
          year: new Date().getFullYear(),
          sortOrder: await this.nextSortOrder(),
        });

    await this.replaceImages(
      product.id,
      product.slug,
      input.name.trim(),
      input.images,
    );
    await this.productAttributes.saveValuesForProduct(
      product.id,
      category,
      input.attributeValues,
    );
    const saved = await this.products.findOneOrFail({
      where: { id: product.id },
      relations: productIncludeWithSrc,
    });
    void this.catalogRevalidation.notifyChanged();
    return toAdminProduct(
      saved,
      await this.productAttributes.valuesForProduct(product.id),
    );
  }

  /**
   * `nextRadNumber()` reads `MAX(radNumber)` outside any lock, so two
   * concurrent "create product" saves can read the same max and both
   * attempt the next number. The DB's unique constraint rejects the loser
   * rather than letting it duplicate the number, but without this retry
   * that surfaces as a confusing failed save instead of just getting the
   * next available number transparently.
   */
  private async createProductWithRadNumber(
    product: Omit<Parameters<Repository<Product>["create"]>[0], "radNumber">,
    attempt = 1,
  ): Promise<Product> {
    try {
      return await this.products.save(
        this.products.create({
          ...product,
          radNumber: await nextRadNumber(this.products),
        }),
      );
    } catch (error) {
      const isRadNumberConflict =
        error instanceof QueryFailedError &&
        String((error.driverError as { detail?: string })?.detail).includes(
          "radNumber",
        );
      if (isRadNumberConflict && attempt < 3) {
        return this.createProductWithRadNumber(product, attempt + 1);
      }
      throw error;
    }
  }

  async deleteProduct(id: string) {
    const product = await this.products.findOne({
      where: { id },
      relations: { orderItems: true },
    });
    if (!product) throw new NotFoundException("محصول پیدا نشد.");
    if (product.orderItems.length) {
      throw new ConflictException("این اثر در سفارش ثبت شده و قابل حذف نیست.");
    }
    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(CartItem)
        .delete({ productSlug: product.slug });
      await manager
        .getRepository(Favorite)
        .delete({ productSlug: product.slug });
      await manager.getRepository(Review).delete({ productSlug: product.slug });
      await manager.getRepository(Product).delete({ id });
    });
    void this.catalogRevalidation.notifyChanged();
    return { ok: true };
  }

  async listOrders() {
    await this.inventory.releaseExpiredHolds();
    const orders = await this.orders.find({
      relations: adminOrderRelations,
      order: { createdAt: "DESC" },
    });
    return orders.map(toAdminOrder);
  }

  async updateOrder(id: string, input: UpdateOrderDto) {
    await this.inventory.releaseExpiredHolds();
    const order = await this.orders.findOne({
      where: { id },
      relations: adminOrderRelations,
    });
    if (!order) throw new NotFoundException("سفارش پیدا نشد.");
    const slugs = order.items.map((item) => item.productSlug);
    const currentStatus = normalizeStoreOrderStatus(order.status);
    const nextStatus = normalizeStoreOrderStatus(input.status);
    const trackingCode =
      input.trackingCode?.trim() ||
      (nextStatus === "shipped"
        ? order.trackingCode || `RAD-POST-${id.slice(-4)}`
        : order.trackingCode);

    if (!canManuallyTransitionOrder(currentStatus, nextStatus)) {
      if (nextStatus === "confirmed" || nextStatus === "rejected") {
        throw new BadRequestException(
          "تأیید یا رد پرداخت فقط از بخش بررسی رسید انجام می‌شود.",
        );
      }
      throw new BadRequestException(
        `تغییر وضعیت سفارش از «${currentStatus}» به «${nextStatus}» مجاز نیست.`,
      );
    }

    const updated = await this.dataSource.transaction(async (manager) => {
      const orders = manager.getRepository(Order);
      if (nextStatus !== currentStatus) {
        if (nextStatus === "cancelled" || nextStatus === "returned") {
          await this.inventory.restock(manager, slugs);
          await manager.getRepository(PaymentIntent).update(
            {
              orderId: id,
              status: In(["created", "redirected", "submitted"]),
            },
            { status: "failed" },
          );
        } else {
          await this.inventory.markSold(manager, slugs);
        }
      }

      await orders.update(
        { id },
        {
          status: nextStatus,
          paymentDueAt: nextStatus === "cancelled" ? null : order.paymentDueAt,
          trackingCode: trackingCode || null,
          deliveredAt:
            nextStatus === "delivered"
              ? (order.deliveredAt ?? new Date())
              : nextStatus === "returned"
                ? order.deliveredAt
                : null,
          estimatedDeliveryAt:
            nextStatus === "shipped" ||
            nextStatus === "confirmed" ||
            nextStatus === "packing"
              ? (order.estimatedDeliveryAt ??
                new Date(Date.now() + 6 * 24 * 60 * 60 * 1000))
              : order.estimatedDeliveryAt,
        },
      );

      return orders.findOneOrFail({
        where: { id },
        relations: adminOrderRelations,
      });
    });
    if (nextStatus !== currentStatus) {
      void this.catalogRevalidation.notifyChanged();
    }
    return toAdminOrder(updated);
  }

  async approvePayment(id: string, reviewerId: string | null) {
    await this.paymentReview.approve(id, reviewerId);
    void this.catalogRevalidation.notifyChanged();
    return this.adminOrder(id);
  }

  async rejectPayment(id: string, reason: string, reviewerId: string | null) {
    await this.paymentReview.reject(id, reason, reviewerId);
    void this.catalogRevalidation.notifyChanged();
    return this.adminOrder(id);
  }

  /** Staff-triggered recheck for a gateway payment nobody else is acting on. */
  async reconcileGatewayPayment(id: string) {
    await this.ordersService.adminReconcileGatewayPayment(id);
    return this.adminOrder(id);
  }

  private async adminOrder(id: string) {
    const order = await this.orders.findOneOrFail({
      where: { id },
      relations: adminOrderRelations,
    });
    return toAdminOrder(order);
  }

  async listMembers() {
    const users = await this.users.find({
      where: { adminRole: Not(IsNull()) },
      order: { createdAt: "ASC" },
    });
    return users.map(toAdminMember);
  }

  async listUsers() {
    const users = await this.users.find({
      where: { adminRole: IsNull() },
      order: { createdAt: "DESC" },
    });
    return users.map(toAdminUser);
  }

  /**
   * Creates the invited account and emails a one-time code the invitee uses
   * on the "set password" screen (same code mechanism and endpoint as
   * forgot-password: `POST /auth/password/reset`, which already accepts an
   * `invited`-status account and flips it to `active`). The account and its
   * token are created up front with an unguessable password hash (never
   * emailed), but if the invite email fails to send we roll both back —
   * otherwise the admin would be left with an invited member who can never
   * find out they were invited, and no way to resend without creating a
   * confusing duplicate-email conflict.
   */
  async inviteMember(input: InviteMemberDto) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findOne({ where: { email } });
    if (existing) throw new ConflictException("این ایمیل قبلاً ثبت شده است.");

    const user = await this.users.save(
      this.users.create({
        name: input.name.trim(),
        email,
        passwordHash: await hash(randomBytes(18).toString("hex"), 12),
        role: "admin",
        adminRole: input.role,
        status: "invited",
      }),
    );
    try {
      await this.issueInviteToken(user);
    } catch (error) {
      await this.users.delete({ id: user.id });
      throw error;
    }
    return toAdminMember(user);
  }

  /** Re-sends an invite (e.g. the first email bounced or expired) without creating a second account. */
  async resendInvite(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user?.adminRole) throw new NotFoundException("عضو پیدا نشد.");
    if (user.status !== "invited") {
      throw new ConflictException("این حساب قبلاً فعال شده است.");
    }
    await this.issueInviteToken(user);
    return toAdminMember(user);
  }

  /** Single-use (deleted on consume by `AuthService.resetPassword`), expiring, replaces any prior token for this user. */
  private async issueInviteToken(user: User) {
    const { code, tokenHash, expiresAt } =
      generateVerificationCode(INVITE_TOKEN_TTL_MS);
    await this.resetTokens.delete({ userId: user.id });
    await this.resetTokens.save(
      this.resetTokens.create({ userId: user.id, tokenHash, expiresAt }),
    );
    await this.mail.sendAdminInvite(user.email, code);
  }

  async updateMember(id: string, input: UpdateMemberDto) {
    const user = await this.users.findOne({ where: { id } });
    if (!user?.adminRole) throw new NotFoundException("عضو پیدا نشد.");
    if (user.adminRole === "owner" && input.role && input.role !== "owner") {
      throw new ForbiddenException("نقش مالک قابل تغییر نیست.");
    }
    await this.users.update(
      { id },
      {
        ...(input.role && user.adminRole !== "owner"
          ? { adminRole: input.role }
          : {}),
        ...(input.status ? { status: input.status } : {}),
      },
    );
    const updated = await this.users.findOneOrFail({ where: { id } });
    return toAdminMember(updated);
  }

  private async nextSortOrder() {
    const last = await this.products.find({
      order: { sortOrder: "DESC" },
      take: 1,
    });
    return (last[0]?.sortOrder ?? 0) + 1;
  }

  private async ensureVendor(artist: string) {
    const id = artistVendorId(artist);
    if (!id) return null;
    const existing = await this.vendors.findOne({ where: { id } });
    if (existing) {
      await this.vendors.update({ id }, { displayName: artist.trim() });
    } else {
      await this.vendors.save(
        this.vendors.create({
          id,
          displayName: artist.trim(),
          displayNameEn: artist.trim(),
          kind: "guest_artist",
          verified: true,
        }),
      );
    }
    return id;
  }

  private async updateProduct(
    id: string,
    data: {
      slug: string;
      name: string;
      tomanPrice: number;
      usdPrice: number;
      category: string;
      status: ProductStatus;
      story: string;
      /** Only written when admin explicitly set one; otherwise left as-is. */
      subtitle?: string;
      vendorId: string | null;
    },
  ) {
    const current = await this.products.findOne({ where: { id } });
    if (!current) throw new NotFoundException("محصول پیدا نشد.");
    if (current.slug !== data.slug) {
      throw new ConflictException("شناسه URL پس از ایجاد قابل تغییر نیست.");
    }
    this.inventory.assertManualTransition(current, data.status);
    await this.products.update(
      { id },
      {
        name: data.name,
        // `subtitle` is a separate, shorter field from Admin's
        // "description" (which maps to `story` below). Re-deriving and
        // overwriting it from `story` on every save — even when admin
        // didn't touch it — used to silently discard whatever value it
        // held, so it's only written when `data.subtitle` is explicitly
        // set; omitted here, it keeps its current value.
        ...(data.subtitle !== undefined ? { subtitle: data.subtitle } : {}),
        tomanPrice: data.tomanPrice,
        usdPrice: data.usdPrice,
        category: data.category,
        status: data.status,
        story: data.story,
        vendorId: data.vendorId,
      },
    );
    return this.products.findOneOrFail({ where: { id } });
  }

  private async replaceImages(
    productId: string,
    slug: string,
    name: string,
    images: AdminProductImageInputDto[],
  ) {
    const rows = images.map((image, sortOrder) => {
      if (image.storage === "legacy_base64") {
        if (!image.src) throw new BadRequestException(productImageError);
        try {
          assertImageData(image.src, productImageLimit, productImageError);
        } catch {
          throw new BadRequestException(productImageError);
        }
        return {
          productSlug: slug,
          storage: "legacy_base64" as const,
          src: image.src,
          objectKey: null,
          alt: name,
          enAlt: name,
          sortOrder,
        };
      }
      if (image.storage === "static" || image.storage === "external") {
        if (!image.src) throw new BadRequestException(productImageError);
        return {
          productSlug: slug,
          storage: image.storage,
          src: image.src,
          objectKey: null,
          alt: name,
          enAlt: name,
          sortOrder,
        };
      }
      // storage is a remote-media kind (cloudinary/cloudinary_video, or
      // seaweedfs/seaweedfs_video when MEDIA_STORAGE_PROVIDER=seaweedfs):
      // never trust the client's objectKey blindly, even though the
      // browser uploaded the bytes directly to the storage provider with
      // our signature — re-validate it matches exactly what our own sign
      // endpoint would have issued for this product
      // (`rad/products/<productId>/<id>`, or the unassociated
      // `rad/pending/<id>` namespace for an image attached before the
      // product existed), so a client can't point a product at an
      // arbitrary asset elsewhere in the provider's account/bucket.
      // Namespacing by the immutable `productId` (not `slug`) means this
      // still holds even if `slug` were ever renamed. Unlike the R2
      // design this replaces, a `rad/pending/...` object key is persisted
      // as-is — no rename/migration step — see `cloudinary-storage.service.ts`.
      if (
        !image.objectKey ||
        !isValidProductImagePublicId(productId, image.objectKey)
      ) {
        throw new BadRequestException(
          "کلید تصویر نامعتبر است. تصویر را دوباره بارگذاری کنید.",
        );
      }
      return {
        productSlug: slug,
        storage: image.storage as ProductImageStorage,
        src: null,
        objectKey: image.objectKey,
        alt: name,
        enAlt: name,
        sortOrder,
      };
    });

    // Figure out which remote-media assets are being dropped (removed or
    // replaced) before we touch the DB, so we can clean them up — from
    // whichever provider each row's own `storage` kind actually lives in
    // (`this.storageFor`), never just the currently-active one — only
    // *after* the delete+reinsert transaction below has actually
    // committed. Never before, since deleting storage ahead of a
    // DB write that could still roll back would leave a product.image
    // pointing at nothing.
    const existing = await this.productImages.find({
      where: { productSlug: slug },
    });
    const keptObjectKeys = new Set(
      rows
        .filter((row) => isRemoteMediaStorage(row.storage))
        .map((row) => row.objectKey as string),
    );
    const orphanedObjectKeys = existing
      .filter(
        (row) =>
          isRemoteMediaStorage(row.storage) &&
          row.objectKey &&
          !keptObjectKeys.has(row.objectKey),
      )
      .map((row) => ({
        objectKey: row.objectKey as string,
        storage: row.storage as ProductImageStorage,
        kind: isVideoStorage(row.storage)
          ? ("video" as const)
          : ("image" as const),
      }));

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(ProductImage, { productSlug: slug });
      if (!rows.length) return;
      await manager.save(
        ProductImage,
        rows.map((row) => manager.create(ProductImage, row)),
      );
    });

    if (orphanedObjectKeys.length) {
      // Best-effort: an orphaned Cloudinary asset left behind is an
      // acceptable cost; failing the whole save because the Cloudinary
      // delete flaked is not. `destroy` treats "not found" as success, so
      // a repeated/duplicate save of the same diff never double-deletes or
      // errors.
      for (const { objectKey, storage, kind } of orphanedObjectKeys) {
        try {
          await this.storageFor(storage).destroy(objectKey, kind);
        } catch {
          this.logger.warn(
            `Failed to delete orphaned ${storage} asset; retry cleanup later.`,
          );
        }
      }
    }
  }
}
