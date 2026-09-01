import type { Product, ProductImage, Vendor, Order, OrderItem, User } from "@prisma/client";

const categoryToStore: Record<string, string> = {
  گلدان: "ceramics",
  ظروف: "ceramics",
  مجسمه: "sculpture",
  "سفال و سرامیک": "ceramics",
  نقاشی: "painting",
  "پارچه و بافت": "textile",
  "آثار چوبی": "woodwork",
  "زیورآلات هنری": "jewelry",
  "چاپ دستی و تصویر": "print",
};

const storeToCategory: Record<string, string> = {
  vases: "گلدان",
  tableware: "ظروف",
  ceramics: "سفال و سرامیک",
  sculpture: "مجسمه",
  painting: "نقاشی",
  textile: "پارچه و بافت",
  woodwork: "آثار چوبی",
  jewelry: "زیورآلات هنری",
  print: "چاپ دستی و تصویر",
};

export function toStoreCategory(label: string) {
  return categoryToStore[label] ?? "ceramics";
}

export function toAdminCategory(value: string) {
  return storeToCategory[value] ?? "سفال و سرامیک";
}

export function artistVendorId(artist: string) {
  const name = artist.trim();
  if (!name || name.includes("رَد") || name.toLowerCase().includes("rad studio")) return null;
  return `artist-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

export function toAdminProduct(
  product: Product & { images: ProductImage[]; vendor: Vendor | null },
) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.story,
    category: toAdminCategory(product.category),
    price: product.tomanPrice,
    status: product.status as "draft" | "available" | "reserved" | "sold",
    artist: product.vendor?.displayName ?? "استودیو رَد",
    images: product.images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => image.src)
      .filter((src): src is string => Boolean(src)),
    updatedAt: product.updatedAt.getTime(),
  };
}

export function toAdminOrder(
  order: Order & { items: Array<OrderItem & { product?: { name: string } | null }> },
) {
  return {
    id: order.id,
    customer: order.name,
    productName: order.items.map((item) => item.product?.name ?? item.productSlug).join("، "),
    amount: order.total,
    status: order.status,
    createdAt: order.createdAt.getTime(),
  };
}

export function toAdminMember(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: (user.adminRole ?? "viewer") as "owner" | "manager" | "editor" | "viewer",
    status: (user.status === "invited" ? "invited" : "active") as "active" | "invited",
  };
}
