export type Locale = "fa" | "en";
export type ProductShape = "tall" | "round" | "wide";
export type ProductCategory =
  | "ceramics"
  | "painting"
  | "textile"
  | "woodwork"
  | "sculpture"
  | "jewelry"
  | "print"
  | "vases"
  | "tableware";
export type ProductVisual =
  | "vessel"
  | "painting"
  | "textile"
  | "wood"
  | "sculpture"
  | "jewelry"
  | "print";
export type ProductStatus = "draft" | "review" | "available" | "reserved" | "sold";

const categoryVisual: Record<string, ProductVisual> = {
  ceramics: "vessel",
  vases: "vessel",
  tableware: "vessel",
  painting: "painting",
  textile: "textile",
  woodwork: "wood",
  sculpture: "sculpture",
  jewelry: "jewelry",
  print: "print",
};

export function visualForCategory(category: string): ProductVisual {
  return categoryVisual[category] ?? "vessel";
}

export interface Vendor {
  id: string;
  displayName: string;
  displayNameEn: string;
  kind: "rad" | "guest_artist";
  verified: boolean;
}

export interface ProductImage {
  src?: string;
  alt: string;
  enAlt: string;
  color?: string;
  accent?: string;
  shape?: ProductShape;
}

export interface Product {
  slug: string;
  name: string;
  subtitle: string;
  price: string;
  usdPrice: number;
  color: string;
  accent: string;
  shape: ProductShape;
  category: ProductCategory;
  visual?: ProductVisual;
  status?: ProductStatus;
  story: string;
  details: string[];
  images?: ProductImage[];
  vendor?: Vendor;
  artworkNumber?: string;
  en: { name: string; subtitle: string; story: string; details: string[] };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "artist" | "admin";
  adminRole?: "owner" | "manager" | "editor" | "viewer" | null;
}
export type StoreOrderStatus =
  | "payment_pending"
  | "confirmed"
  | "packing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";
export type OrderStatus = StoreOrderStatus;

export const STORE_ORDER_STATUSES: StoreOrderStatus[] = [
  "payment_pending",
  "confirmed",
  "packing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export const STORE_ORDER_PROGRESS: StoreOrderStatus[] = [
  "payment_pending",
  "confirmed",
  "packing",
  "shipped",
  "delivered",
];

export const storeOrderStatusLabels = {
  payment_pending: "در انتظار پرداخت",
  confirmed: "سفارش ثبت شد",
  packing: "در حال بسته‌بندی",
  shipped: "تحویل به پست",
  delivered: "تحویل داده شد",
  cancelled: "لغوشده",
  returned: "مرجوع‌شده",
} as const satisfies Record<StoreOrderStatus, string>;

const legacyStoreOrderStatus: Record<string, StoreOrderStatus> = {
  received: "payment_pending",
  approved: "confirmed",
  forming: "packing",
  drying: "packing",
  firing: "packing",
  glazing: "packing",
  quality: "packing",
};

export function normalizeStoreOrderStatus(status: string): StoreOrderStatus {
  if ((STORE_ORDER_STATUSES as string[]).includes(status)) {
    return status as StoreOrderStatus;
  }
  return legacyStoreOrderStatus[status] ?? "confirmed";
}

export interface Order {
  id: string;
  slugs: string[];
  total: number;
  usdTotal?: number;
  createdAt: number;
  status: StoreOrderStatus;
  delivery: { name: string; city: string; phone?: string; address?: string };
  trackingCode?: string | null;
  estimatedDeliveryAt?: number | null;
}
export interface Review { id: string; productSlug: string; author: string; rating: number; comment: string; image?: string; createdAt: number; }
export interface PaymentIntent { id: string; orderId: string; amount: number; currency: "IRR" | "USD"; provider: "sandbox" | "zarinpal"; status: "created" | "redirected" | "verified" | "failed"; }
export type NoticeKind =
  | "favorite"
  | "cart"
  | "welcome"
  | "order"
  | "commission_approved"
  | "commission_declined"
  | "commission_change"
  | "commission_message";
export interface Notice { id: string; kind: NoticeKind; productSlug?: string; read: boolean; createdAt: number; }
export interface CartSnapshot { slugs: string[]; }
