import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { assertImageData, productImageError, productImageLimit } from "../common/image-data";
import { PrismaService } from "../prisma/prisma.service";
import { productInclude } from "../catalog/product.mapper";
import { canAdmin, type AdminPermission } from "./permissions";
import {
  artistVendorId,
  toAdminMember,
  toAdminOrder,
  toAdminProduct,
  toStoreCategory,
} from "./admin.mapper";
import type { InviteMemberDto, SaveProductDto, UpdateMemberDto, UpdateOrderDto } from "./dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  assert(role: string | undefined, permission: AdminPermission) {
    if (!canAdmin(role, permission)) {
      throw new ForbiddenException("برای این عملیات دسترسی ندارید.");
    }
  }

  async listProducts() {
    const products = await this.prisma.product.findMany({
      include: productInclude,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    });
    return products.map(toAdminProduct);
  }

  async saveProduct(input: SaveProductDto, existingId?: string) {
    const slug = input.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const duplicate = await this.prisma.product.findUnique({ where: { slug } });
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
      : await this.prisma.product.create({
          data: {
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
            sortOrder: await this.nextSortOrder(),
          },
        });

    await this.replaceImages(product.slug, input.name.trim(), input.images);
    const saved = await this.prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: productInclude,
    });
    return toAdminProduct(saved);
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { orderItems: true },
    });
    if (!product) throw new NotFoundException("محصول پیدا نشد.");
    if (product.orderItems.length) {
      throw new ConflictException("این اثر در سفارش ثبت شده و قابل حذف نیست.");
    }
    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { productSlug: product.slug } }),
      this.prisma.favorite.deleteMany({ where: { productSlug: product.slug } }),
      this.prisma.review.deleteMany({ where: { productSlug: product.slug } }),
      this.prisma.product.delete({ where: { id } }),
    ]);
    return { ok: true };
  }

  async listOrders() {
    const orders = await this.prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
    return orders.map(toAdminOrder);
  }

  async updateOrder(id: string, input: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException("سفارش پیدا نشد.");
    const slugs = order.items.map((item) => item.productSlug);
    const nextStatus = input.status;
    const fulfillment = shopOrderFulfillment(order);
    const trackingCode =
      input.trackingCode?.trim() ||
      (nextStatus === "shipped"
        ? fulfillment.trackingCode || `RAD-POST-${id.slice(-4)}`
        : fulfillment.trackingCode);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (nextStatus === "cancelled" || nextStatus === "returned") {
        await tx.product.updateMany({
          where: { slug: { in: slugs }, status: { in: ["reserved", "sold"] } },
          data: { status: "available" },
        });
      } else if (nextStatus === "confirmed" || nextStatus === "packing" || nextStatus === "shipped" || nextStatus === "delivered") {
        await tx.product.updateMany({
          where: { slug: { in: slugs } },
          data: { status: nextStatus === "confirmed" || nextStatus === "packing" ? "reserved" : "sold" },
        });
      }

      return tx.order.update({
        where: { id },
        data: {
          status: nextStatus,
          trackingCode: trackingCode || null,
          estimatedDeliveryAt:
            nextStatus === "shipped" || nextStatus === "confirmed" || nextStatus === "packing"
              ? fulfillment.estimatedDeliveryAt ?? new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
              : fulfillment.estimatedDeliveryAt,
        },
        include: { items: { include: { product: true } } },
      });
    });
    return toAdminOrder(updated);
  }

  async listMembers() {
    const users = await this.prisma.user.findMany({
      where: { adminRole: { not: null } },
      orderBy: { createdAt: "asc" },
    });
    return users.map(toAdminMember);
  }

  async inviteMember(input: InviteMemberDto) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("این ایمیل قبلاً ثبت شده است.");
    const user = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash: await hash(randomBytes(18).toString("hex"), 12),
        role: "admin",
        adminRole: input.role,
        status: "invited",
      },
    });
    return toAdminMember(user);
  }

  async updateMember(id: string, input: UpdateMemberDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user?.adminRole) throw new NotFoundException("عضو پیدا نشد.");
    if (user.adminRole === "owner" && input.role && input.role !== "owner") {
      throw new ForbiddenException("نقش مالک قابل تغییر نیست.");
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(input.role && user.adminRole !== "owner" ? { adminRole: input.role } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
    });
    return toAdminMember(updated);
  }

  private async nextSortOrder() {
    const last = await this.prisma.product.findFirst({ orderBy: { sortOrder: "desc" } });
    return (last?.sortOrder ?? 0) + 1;
  }

  private async ensureVendor(artist: string) {
    const id = artistVendorId(artist);
    if (!id) return null;
    await this.prisma.vendor.upsert({
      where: { id },
      update: { displayName: artist.trim() },
      create: {
        id,
        displayName: artist.trim(),
        displayNameEn: artist.trim(),
        kind: "guest_artist",
        verified: true,
      },
    });
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
      status: string;
      story: string;
      vendorId: string | null;
    },
  ) {
    const current = await this.prisma.product.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("محصول پیدا نشد.");
    if (current.slug !== data.slug) {
      throw new ConflictException("شناسه URL پس از ایجاد قابل تغییر نیست.");
    }
    return this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        subtitle: data.subtitle,
        tomanPrice: data.tomanPrice,
        usdPrice: data.usdPrice,
        category: data.category,
        status: data.status,
        story: data.story,
        vendorId: data.vendorId,
      },
    });
  }

  private async replaceImages(slug: string, name: string, images: string[]) {
    await this.prisma.productImage.deleteMany({ where: { productSlug: slug } });
    if (!images.length) return;
    for (const src of images) {
      try {
        assertImageData(src, productImageLimit, productImageError);
      } catch {
        throw new BadRequestException(productImageError);
      }
    }
    await this.prisma.productImage.createMany({
      data: images.map((src, sortOrder) => ({
        productSlug: slug,
        src,
        alt: name,
        enAlt: name,
        sortOrder,
      })),
    });
  }
}

function shopOrderFulfillment(order: unknown) {
  const row = order as {
    trackingCode?: string | null;
    estimatedDeliveryAt?: Date | null;
  };
  return {
    trackingCode: row.trackingCode ?? null,
    estimatedDeliveryAt: row.estimatedDeliveryAt ?? null,
  };
}
