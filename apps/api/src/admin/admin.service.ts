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
import { DataSource, In, IsNull, Not, Repository } from "typeorm";
import {
  assertImageData,
  productImageError,
  productImageLimit,
} from "../common/image-data";
import {
  CloudinaryStorageService,
  isValidProductImagePublicId,
  productImageFolder,
} from "../storage/cloudinary-storage.service";
import { S3StorageService } from "../storage/s3-storage.service";
import { isValidS3ObjectKey } from "../storage/s3-object-key";
import {
  checkIssuedS3Upload,
  recordIssuedS3Upload,
} from "../storage/s3-upload-intent";
import { MEDIA_STORAGE } from "../storage/media-storage.token";
import type { MediaStorage } from "../storage/media-storage.interface";
import type { ProductImageStorage } from "../database/entities/product-image.entity";
import type { AdminProductImageInputDto } from "./dto";
import {
  CartItem,
  Favorite,
  Order,
  PaymentIntent,
  Product,
  ProductImage,
  Review,
  User,
  Vendor,
} from "../database/entities";
import { productIncludeWithSrc } from "../catalog/product.mapper";
import { nextRadNumber } from "../catalog/rad-number";
import { InventoryService } from "../inventory/inventory.service";
import type { ProductStatus } from "../inventory/type";
import { PaymentReviewService } from "../orders/payment-review.service";
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
    private readonly inventory: InventoryService,
    private readonly paymentReview: PaymentReviewService,
    /**
     * The currently-ACTIVE provider (`MEDIA_STORAGE_PROVIDER`), used only
     * for NEW uploads: signing a fresh upload, and verifying what a
     * client just uploaded through that same signature
     * (`signProductImageUpload`/`verifyProductMedia`). Never use this to
     * decide how to verify or delete an EXISTING `ProductImage` row — a
     * row's own `storage` column records which provider it actually
     * lives on, independent of whichever provider is active today (see
     * `storageProviderFor`).
     */
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
    private readonly cloudinaryStorage: CloudinaryStorageService,
    private readonly s3Storage: S3StorageService,
  ) {}

  private readonly logger = new Logger(AdminService.name);

  /** Whether the active (`MEDIA_STORAGE_PROVIDER`) upload provider is S3 — reference equality against the same singleton StorageModule injected, not a config re-read. */
  private isS3Active() {
    return (this.storage as MediaStorage) === this.s3Storage;
  }

  /**
   * The concrete provider an EXISTING (or about-to-be-saved) row's own
   * `storage` tag actually lives on — never the currently-active one.
   * This is what makes deletion and re-verification provider-independent:
   * a legacy `cloudinary`/`cloudinary_video` row is always handled via
   * `CloudinaryStorageService`, and an `s3`/`s3_video` row always via
   * `S3StorageService`, regardless of which provider `MEDIA_STORAGE_PROVIDER`
   * currently selects. Returns `null` for storage kinds with no remote
   * object at all (`static`/`external`/`legacy_base64`/`null`) — nothing
   * to verify or delete through a provider.
   */
  private storageProviderFor(
    storage: ProductImageStorage | null,
  ): MediaStorage | null {
    if (storage === "s3" || storage === "s3_video") return this.s3Storage;
    if (storage === "cloudinary" || storage === "cloudinary_video")
      return this.cloudinaryStorage;
    return null;
  }

  /**
   * Fail-closed ownership check for an `s3`/`s3_video` `objectKey` being
   * attached to the product identified by `slug` (the same stable
   * identity Cloudinary's checks use — `slug` is immutable once a
   * product exists, enforced in `updateProduct`). Throws
   * `BadRequestException` on any failure; returns normally only when
   * ownership is actually proven. Called from `verifyProductMedia`,
   * `saveProduct`, and `replaceImages` — every place an s3 key is
   * trusted before being used or persisted.
   *
   * Namespace shape (`isValidS3ObjectKey`) is checked first but is
   * explicitly NOT treated as sufficient on its own — see below.
   * Ownership is proven by exactly one of two things:
   *
   * 1. DURABLE: this exact `objectKey` is ALREADY a persisted
   *    `ProductImage` row belonging to THIS SAME product (`slug`). This
   *    is a real Postgres row — survives restarts, shared across every
   *    process, no TTL — so an already-attached s3 image never needs
   *    its original upload intent again on a later edit (requirement:
   *    verified media stays attached indefinitely). If the row exists
   *    but belongs to a DIFFERENT product, this is an attempt to claim
   *    already-consumed media and is rejected outright, regardless of
   *    anything else — this is what actually stops a `rad/pending/...`
   *    key (which matches ANY product by namespace shape alone) from
   *    being re-attached elsewhere after it's already been used once.
   *
   * 2. IN-MEMORY, FAIL-CLOSED: for an objectKey with NO existing row
   *    anywhere (a genuinely new attachment), this process must have a
   *    matching record of having minted it itself
   *    (`checkIssuedS3Upload` — `s3-upload-intent.ts`). Both `"unknown"`
   *    (no record — a restart, a different process instance, or TTL
   *    expiry happened since it was signed) and `"mismatch"` (minted by
   *    us, but for a different product/kind) are hard rejections. There
   *    is no fallback to the namespace check alone; losing the
   *    in-memory record never silently downgrades to a weaker check —
   *    it can only ever produce a rejection (the admin re-uploads), not
   *    a wrongful acceptance.
   */
  private async authorizeS3ObjectKey(
    slug: string,
    productId: string | null,
    objectKey: string | undefined,
    kind: "image" | "video",
  ) {
    if (!objectKey || !isValidS3ObjectKey(productId ?? "unsaved", objectKey)) {
      throw new BadRequestException("شناسه فایل نامعتبر است.");
    }
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
    const intentCheck = checkIssuedS3Upload(objectKey, productId, kind);
    if (intentCheck !== "match") {
      this.logger.warn(
        `Rejected unauthorized S3 object key attachment (${intentCheck}): ${objectKey}`,
      );
      throw new BadRequestException("شناسه فایل نامعتبر است.");
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
    if (signed.provider === "s3") {
      // Records that THIS process actually minted this key for this
      // product (or the shared pending namespace) — the ownership proof
      // `authorizeS3ObjectKey` requires for a genuinely new attachment
      // (fail-closed: no record means no attachment, see
      // `s3-upload-intent.ts` and `authorizeS3ObjectKey`'s doc comment).
      recordIssuedS3Upload(signed.objectKey, productId, kind);
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
    const productId = product?.id ?? null;
    // This verifies a FRESH upload (the active provider just signed it a
    // moment ago, via signProductImageUpload above) — so, unlike
    // storageProviderFor, using the active provider here is correct.
    if (this.isS3Active()) {
      await this.authorizeS3ObjectKey(normalizedSlug, productId, objectKey, kind);
    } else if (!isValidProductImagePublicId(productId ?? "unsaved", objectKey)) {
      throw new BadRequestException("شناسه فایل نامعتبر است.");
    }
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
    return products.map(toAdminProduct);
  }

  async saveProduct(input: SaveProductDto, existingId?: string) {
    const slug = input.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const duplicate = await this.products.findOne({ where: { slug } });
    if (duplicate && duplicate.id !== existingId) {
      throw new ConflictException("این شناسه URL قبلاً استفاده شده است.");
    }

    if (
      !input.images.some(
        (image) =>
          image.storage !== "cloudinary_video" && image.storage !== "s3_video",
      )
    )
      throw new BadRequestException("حداقل یک تصویر برای اثر لازم است.");
    // Validate before any product/vendor writes. Existing legacy references remain compatible.
    const productIdForCheck = duplicate?.id ?? null;
    for (const image of input.images) {
      if (
        image.storage === "cloudinary" ||
        image.storage === "cloudinary_video" ||
        image.storage === "s3" ||
        image.storage === "s3_video"
      ) {
        const isS3 = image.storage === "s3" || image.storage === "s3_video";
        const kind =
          image.storage === "cloudinary_video" || image.storage === "s3_video"
            ? "video"
            : "image";
        if (!image.objectKey)
          throw new BadRequestException("شناسه فایل نامعتبر است.");
        if (isS3) {
          // Fail-closed: proven either by an existing ProductImage row of
          // OURS (durable, no intent needed) or a matching in-memory
          // upload intent — never by namespace shape alone.
          await this.authorizeS3ObjectKey(
            slug,
            productIdForCheck,
            image.objectKey,
            kind,
          );
        } else if (
          !isValidProductImagePublicId(
            productIdForCheck ?? "unsaved",
            image.objectKey,
          )
        ) {
          throw new BadRequestException("شناسه فایل نامعتبر است.");
        }
        // Re-verifies through whichever concrete provider THIS image's own
        // storage tag names — never the currently-active provider, which
        // may differ (a product can legitimately mix an older cloudinary
        // row with a newly-uploaded s3 row across a provider switch).
        await this.storageProviderFor(image.storage)!.verifyMedia(
          image.objectKey,
          kind,
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
    const subtitle = input.description.trim().slice(0, 48);
    const details = ["تنها یک نسخه"];
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
          subtitle,
          tomanPrice: input.price,
          usdPrice,
          category,
          status: input.status,
          story: input.description.trim(),
          vendorId,
        })
      : await this.products.save(
          this.products.create({
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
            radNumber: await nextRadNumber(this.products),
            year: new Date().getFullYear(),
            sortOrder: await this.nextSortOrder(),
          }),
        );

    await this.replaceImages(
      product.id,
      product.slug,
      input.name.trim(),
      input.images,
    );
    const saved = await this.products.findOneOrFail({
      where: { id: product.id },
      relations: productIncludeWithSrc,
    });
    return toAdminProduct(saved);
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
    return toAdminOrder(updated);
  }

  async approvePayment(id: string, reviewerId: string | null) {
    await this.paymentReview.approve(id, reviewerId);
    return this.adminOrder(id);
  }

  async rejectPayment(id: string, reason: string, reviewerId: string | null) {
    await this.paymentReview.reject(id, reason, reviewerId);
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
    return toAdminMember(user);
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
      subtitle: string;
      tomanPrice: number;
      usdPrice: number;
      category: string;
      status: ProductStatus;
      story: string;
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
        subtitle: data.subtitle,
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
    const rows = await Promise.all(images.map(async (image, sortOrder) => {
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
      // storage === "cloudinary"/"cloudinary_video"/"s3"/"s3_video": never
      // trust the client's objectKey blindly, even though the browser
      // uploaded the bytes directly to the provider with our signature —
      // re-validate it matches exactly what our own sign endpoint would
      // have issued for this product (`rad/products/<productId>/<id>`,
      // or the unassociated `rad/pending/<id>` namespace for an image
      // attached before the product existed), so a client can't point a
      // product at an arbitrary asset elsewhere in the account/bucket.
      // Namespacing by the immutable `productId` (not `slug`) means this
      // still holds even if `slug` were ever renamed. A `rad/pending/...`
      // key is persisted as-is — no rename/migration step — see
      // `cloudinary-storage.service.ts`/`s3-object-key.ts`.
      if (
        image.storage === "cloudinary" ||
        image.storage === "cloudinary_video"
      ) {
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
          storage: image.storage,
          src: null,
          objectKey: image.objectKey,
          alt: name,
          enAlt: name,
          sortOrder,
        };
      }
      // storage === "s3"/"s3_video": same fail-closed check as
      // saveProduct's own pre-check — redundant by design (defense in
      // depth, matching the existing cloudinary pattern just above),
      // not merely re-validating shape.
      await this.authorizeS3ObjectKey(
        slug,
        productId,
        image.objectKey,
        image.storage === "s3_video" ? "video" : "image",
      );
      return {
        productSlug: slug,
        storage: image.storage,
        src: null,
        objectKey: image.objectKey as string,
        alt: name,
        enAlt: name,
        sortOrder,
      };
    }));

    // Figure out which remote (cloudinary/s3) assets are being dropped
    // (removed or replaced) before we touch the DB, so we can clean them
    // up only *after* the delete+reinsert transaction below has actually
    // committed — never before, since deleting storage ahead of a DB
    // write that could still roll back would leave a product.image
    // pointing at nothing.
    const isRemoteStorage = (storage: ProductImageStorage | null) =>
      storage === "cloudinary" ||
      storage === "cloudinary_video" ||
      storage === "s3" ||
      storage === "s3_video";
    const existing = await this.productImages.find({
      where: { productSlug: slug },
    });
    const keptObjectKeys = new Set(
      rows
        .filter((row) => isRemoteStorage(row.storage))
        .map((row) => row.objectKey as string),
    );
    const orphanedObjectKeys = existing
      .filter(
        (row) =>
          isRemoteStorage(row.storage) &&
          row.objectKey &&
          !keptObjectKeys.has(row.objectKey),
      )
      .map((row) => ({
        objectKey: row.objectKey as string,
        kind:
          row.storage === "cloudinary_video" || row.storage === "s3_video"
            ? ("video" as const)
            : ("image" as const),
        // Captured from the EXISTING row's own storage tag — the row
        // being deleted may have been written under a provider that is
        // no longer the active one (a prior MEDIA_STORAGE_PROVIDER
        // value). Deletion must always go through the provider that
        // actually holds the object, never the currently-active one.
        storage: row.storage,
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
      // Best-effort: an orphaned asset left behind is an acceptable cost;
      // failing the whole save because a provider delete flaked is not.
      // `destroy` treats "not found" as success, so a repeated/duplicate
      // save of the same diff never double-deletes or errors.
      for (const { objectKey, kind, storage } of orphanedObjectKeys) {
        const provider = this.storageProviderFor(storage);
        if (!provider) continue; // unreachable given isRemoteStorage's filter, kept for type-safety
        try {
          await provider.destroy(objectKey, kind);
        } catch {
          this.logger.warn(
            `Failed to delete orphaned ${storage} asset; retry cleanup later.`,
          );
        }
      }
    }
  }
}
