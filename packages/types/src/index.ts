export * from "./artwork";
export * from "./contact";
export * from "./damage-report";
export * from "./policy";

import type { LocalizedText, WorkMark } from "./artwork";
import type { PolicyAcceptance } from "./policy";

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
/**
 * Single inventory state machine for every one-of-one work. The API owns it;
 * storefront and admin only read it.
 *
 * draft → in_workshop → ready → available → sold → archived
 *
 * A cart hold is not a separate state: the product becomes `sold` with a
 * `holdExpiresAt`, and returns to `available` if payment is not completed.
 */
export const PRODUCT_STATUSES = [
  "draft",
  "in_workshop",
  "ready",
  "available",
  "sold",
  "archived",
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Statuses the public API returns. Drafts never leave the admin. */
export const PUBLIC_PRODUCT_STATUSES: ProductStatus[] = [
  "in_workshop",
  "ready",
  "available",
  "sold",
  "archived",
];

/** Manual transitions staff may make; checkout owns available → sold. */
export const PRODUCT_STATUS_TRANSITIONS: Record<
  ProductStatus,
  ProductStatus[]
> = {
  draft: ["in_workshop", "ready", "available", "archived"],
  in_workshop: ["draft", "ready", "archived"],
  ready: ["in_workshop", "available", "archived"],
  available: ["ready", "sold", "archived"],
  sold: ["available", "archived"],
  archived: ["available", "sold"],
};

export function canTransitionProductStatus(
  from: ProductStatus,
  to: ProductStatus,
) {
  return from === to || PRODUCT_STATUS_TRANSITIONS[from].includes(to);
}

export function isPurchasableStatus(status?: ProductStatus) {
  return status === "available";
}

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

/**
 * A place on a photograph where one material of the work is seen up close.
 * `x`/`y` are % of the frame; `span` is how much of the frame's width a long
 * strip may cover around that point and still show only this material. Across
 * a work, the widest spot leads.
 */
export interface MaterialSpot {
  x: number;
  y: number;
  span?: number;
  material: LocalizedText;
}

export interface ProductImage {
  src?: string;
  alt: string;
  enAlt: string;
  color?: string;
  accent?: string;
  shape?: ProductShape;
  spots?: MaterialSpot[];
  /** Points on this photograph the maker annotated. */
  marks?: WorkMark[];
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
  /** Epoch ms. Set while a `sold` work is only held by a cart or unpaid checkout. */
  reservedUntil?: number;
  story: string;
  details: string[];
  images?: ProductImage[];
  vendor?: Vendor;
  /** Same permanent number as `Artwork.radNumber`. */
  radNumber?: number;
  artworkNumber?: string;
  /** Epoch ms the work entered the catalogue; absent in static fallback data. */
  listedAt?: number;
  en: { name: string; subtitle: string; story: string; details: string[] };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "artist" | "admin";
  adminRole?: "owner" | "manager" | "editor" | "viewer" | null;
}
/**
 * pending_payment → pending_verification → confirmed → packing → shipped → delivered
 *
 * A valid order reserves its works for {@link ORDER_PAYMENT_WINDOW_MINUTES};
 * without a receipt it becomes `expired`. Once a receipt is uploaded the
 * order waits in `pending_verification` without a deadline until RAD
 * confirms or rejects it. `expired`, `rejected`, `cancelled` and `returned`
 * are terminal and restock the work.
 */
export type StoreOrderStatus =
  | "pending_payment"
  | "pending_verification"
  | "confirmed"
  | "packing"
  | "shipped"
  | "delivered"
  | "expired"
  | "rejected"
  | "cancelled"
  | "returned";
export type OrderStatus = StoreOrderStatus;

export const STORE_ORDER_STATUSES: StoreOrderStatus[] = [
  "pending_payment",
  "pending_verification",
  "confirmed",
  "packing",
  "shipped",
  "delivered",
  "expired",
  "rejected",
  "cancelled",
  "returned",
];

export const STORE_ORDER_PROGRESS: StoreOrderStatus[] = [
  "pending_payment",
  "pending_verification",
  "confirmed",
  "packing",
  "shipped",
  "delivered",
];

export const TERMINAL_STORE_ORDER_STATUSES: StoreOrderStatus[] = [
  "expired",
  "rejected",
  "cancelled",
  "returned",
];

export function isTerminalStoreOrderStatus(status: StoreOrderStatus) {
  return TERMINAL_STORE_ORDER_STATUSES.includes(status);
}

/** Mirrors `ORDER_PAYMENT_WINDOW_MS` in the API. */
export const ORDER_PAYMENT_WINDOW_MINUTES = 30;

/** Mirrors `CART_HOLD_MS` in the API. */
export const CART_HOLD_MINUTES = 15;

export const storeOrderStatusLabels = {
  pending_payment: "در انتظار پرداخت",
  pending_verification: "در انتظار تأیید پرداخت",
  confirmed: "سفارش تأیید شد",
  packing: "در حال بسته‌بندی",
  shipped: "تحویل به پست",
  delivered: "تحویل داده شد",
  expired: "منقضی‌شده",
  rejected: "پرداخت رد شد",
  cancelled: "لغوشده",
  returned: "مرجوع‌شده",
} as const satisfies Record<StoreOrderStatus, string>;

const legacyStoreOrderStatus: Record<string, StoreOrderStatus> = {
  payment_pending: "pending_payment",
  received: "pending_payment",
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
  /** Epoch ms the order was marked delivered; starts the damage-report window. */
  deliveredAt?: number;
  /** Present while payment is still open (or after confirm for history). */
  payment?: OrderPayment;
  /** Policy versions the buyer accepted at checkout. Older orders have none. */
  policyAcceptance?: PolicyAcceptance;
}
export interface Review {
  id: string;
  productSlug: string;
  author: string;
  rating: number;
  comment: string;
  image?: string;
  createdAt: number;
}
export type PaymentProvider = "sandbox" | "manual_card" | "zarinpal";
export type PaymentMode = "manual_card" | "gateway";
export type PaymentStatus =
  "created" | "redirected" | "submitted" | "verified" | "rejected" | "failed";
export interface ManualCardPayment {
  cardNumber: string;
  cardHolder: string;
  bankName?: string;
}
/** How the customer should complete payment for a pending order. */
export interface OrderPayment {
  mode: PaymentMode;
  provider: PaymentProvider;
  status: PaymentStatus;
  /** Exact toman amount the customer must transfer. */
  amount?: number;
  /** Shown while the live gateway is offline — customer transfers to this card. */
  manualCard?: ManualCardPayment;
  /** When the gateway is connected, the storefront navigates here. */
  redirectUrl?: string;
  /** Receipt uploaded by the customer (data URL). */
  receiptImage?: string;
  /** Bank transfer tracking / reference number entered with the receipt. */
  trackingNumber?: string;
  submittedAt?: number;
  reviewedAt?: number;
  /** Why RAD refused the receipt; set when `status` is `rejected`. */
  rejectionReason?: string;
  /** `pending_payment` orders expire and restock their works after this (epoch ms). */
  dueAt?: number;
}
export interface PaymentIntent {
  id: string;
  orderId: string;
  amount: number;
  currency: "IRR" | "USD";
  provider: PaymentProvider;
  status: PaymentStatus;
  receiptImage?: string;
  submittedAt?: number;
}
export type NoticeKind =
  | "favorite"
  | "cart"
  | "welcome"
  | "order"
  | "order_confirmed"
  | "order_rejected"
  | "commission_approved"
  | "commission_declined"
  | "commission_change"
  | "commission_message"
  | "commission_quote"
  | "commission_pre_kiln"
  | "commission_firing"
  | "commission_balance"
  | "commission_shipped";
export interface Notice {
  id: string;
  kind: NoticeKind;
  productSlug?: string;
  read: boolean;
  createdAt: number;
}
export interface CartSnapshot {
  slugs: string[];
  /** Hold deadline per slug (epoch ms). Unpaid holds return to `available` after it. */
  holds: Record<string, number>;
  /** Price per slug when it entered the bag; missing for older cart rows. */
  prices?: Record<string, CartPriceAtAdd>;
}

export interface CartPriceAtAdd {
  toman: number;
  usd: number;
}

export type FaqIcon = "shield-check" | "package-check" | "truck" | "palette";

export interface FaqItem {
  id: string;
  icon: FaqIcon;
  question: string;
  answer: string;
}

export interface FaqContent {
  eyebrow: string;
  title: string;
  items: FaqItem[];
}
