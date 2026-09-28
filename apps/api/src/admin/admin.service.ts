import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
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
  ) {}

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

    await this.replaceImages(product.slug, input.name.trim(), input.images);
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
          await manager
            .getRepository(PaymentIntent)
            .update(
              { orderId: id, status: In(["created", "redirected", "submitted"]) },
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
          paymentDueAt:
            nextStatus === "cancelled" ? null : order.paymentDueAt,
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

      return orders.findOneOrFail({ where: { id }, relations: adminOrderRelations });
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

  private async replaceImages(slug: string, name: string, images: string[]) {
    await this.productImages.delete({ productSlug: slug });
    if (!images.length) return;
    for (const src of images) {
      try {
        assertImageData(src, productImageLimit, productImageError);
      } catch {
        throw new BadRequestException(productImageError);
      }
    }
    await this.productImages.save(
      images.map((src, sortOrder) =>
        this.productImages.create({
          productSlug: slug,
          src,
          alt: name,
          enAlt: name,
          sortOrder,
        }),
      ),
    );
  }
}
