import type {
  Order,
  OrderItem,
  Product,
  ProductImage,
  User,
  Vendor,
} from "../database/entities";
import { imageSrc } from "../catalog/product.mapper";
import { toAdminCategory, toStoreCategory } from "../catalog/category";
import { normalizeProductStatus } from "../inventory/product-status";
import { normalizeStoreOrderStatus } from "../orders/store-order-status";
import { toPolicyAcceptance } from "../policies/policy-acceptance";
import type { OrderPaymentProvider, OrderPaymentStatus } from "../orders/type";

export { toAdminCategory, toStoreCategory };

export function artistVendorId(artist: string) {
  const name = artist.trim();
  if (
    !name ||
    name.includes("رَد") ||
    name.toLowerCase().includes("rad studio")
  )
    return null;
  return `artist-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

export function toAdminProduct(
  product: Product & { images: ProductImage[]; vendor: Vendor | null },
  attributeValues: Record<string, unknown> = {},
) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.story,
    category: toAdminCategory(product.category),
    price: product.tomanPrice ?? 0,
    status: normalizeProductStatus(product.status),
    // `reservedUntil` matches the public mapper's derived field so Admin and
    // Storefront resolve the same hold-vs-sale distinction the same way
    // (see `effectiveProductStatus` in @rad/types). `holdExpiresAt`/`held`
    // stay for the admin-only "awaiting payment verification" nuance.
    reservedUntil:
      normalizeProductStatus(product.status) === "sold" && product.holdExpiresAt
        ? product.holdExpiresAt.getTime()
        : undefined,
    holdExpiresAt: product.holdExpiresAt?.getTime(),
    held: Boolean(product.heldBy),
    artist: product.vendor?.displayName ?? "استودیو رَد",
    // Round-trippable shape: the admin UI re-sends this array, unchanged,
    // for any image it didn't touch — `storage`/`objectKey` must survive
    // the trip for `cloudinary` rows (which have no `src` to fall back
    // on), while `src` here is a ready-to-render URL/base64 string for the
    // editor's `<img>` preview, not necessarily the DB column value
    // (cloudinary derives it).
    images: product.images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => ({
        storage: image.storage ?? "legacy_base64",
        src:
          image.storage === "cloudinary" ||
          image.storage === "cloudinary_video" ||
          image.storage === "seaweedfs" ||
          image.storage === "seaweedfs_video"
            ? (imageSrc(image, false) ?? null)
            : image.src,
        objectKey: image.objectKey ?? null,
      })),
    updatedAt: product.updatedAt.getTime(),
    attributeValues,
  };
}

export function toAdminOrder(
  order: Order & {
    items: Array<
      OrderItem & {
        product?: { name: string; radNumber: number | null } | null;
      }
    >;
  },
) {
  const payment = order.payment;
  return {
    id: order.id,
    customer: order.name,
    phone: order.phone || undefined,
    city: order.city || undefined,
    address: order.address || undefined,
    productName: order.items
      .map((item) => item.product?.name ?? item.productSlug)
      .join("، "),
    products: order.items.map((item) => ({
      slug: item.productSlug,
      name: item.product?.name ?? item.productSlug,
      radNumber: item.product?.radNumber ?? undefined,
    })),
    amount: order.total,
    status: normalizeStoreOrderStatus(order.status),
    trackingCode: order.trackingCode ?? undefined,
    createdAt: order.createdAt.getTime(),
    deliveredAt: order.deliveredAt?.getTime(),
    policyAcceptance: toPolicyAcceptance(
      order.policyVersions,
      order.policiesAcceptedAt,
    ),
    paymentDueAt: order.paymentDueAt?.getTime(),
    paymentProvider: payment?.provider as OrderPaymentProvider | undefined,
    paymentStatus: payment?.status as OrderPaymentStatus | undefined,
    paymentAmount: payment?.amount,
    receiptImage: payment?.receiptImage || undefined,
    paymentTrackingNumber: payment?.trackingNumber || undefined,
    paymentGatewayRefId: payment?.gatewayRefId || undefined,
    paymentSubmittedAt: payment?.submittedAt?.getTime(),
    receiptSubmissions: payment?.receiptSubmissions ?? 0,
    paymentReviewedAt: payment?.reviewedAt?.getTime(),
    paymentVerifiedAt: payment?.verifiedAt?.getTime(),
    rejectionReason: payment?.rejectionReason || undefined,
  };
}

export function toAdminMember(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: (user.adminRole ?? "viewer") as
      "owner" | "manager" | "editor" | "viewer",
    status: (user.status === "invited" ? "invited" : "active") as
      "active" | "invited",
  };
}

export function toAdminUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: (user.status === "invited" ? "invited" : "active") as
      "active" | "invited",
    createdAt: user.createdAt.getTime(),
  };
}
