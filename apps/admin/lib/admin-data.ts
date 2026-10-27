import {
  PRODUCT_STATUSES,
  canTransitionProductStatus,
  effectiveProductStatus,
  type ContactMessageStatus,
  type ContactSource,
  type ContactTopic,
  type DamageReport,
  type DamageReportStatus,
  type DamageResolution,
  type PolicyAcceptance,
  type PolicySlug,
  type ProductAttributeValue,
  type ProductStatus,
  type ShapeTrait,
} from "@rad/types";

export type {
  AdminReview,
  HelpQuestion,
  HelpQuestionInput,
  ProductAttribute,
  ProductAttributeInput,
  ProductAttributeInputType,
  ProductAttributeOption,
  ProductAttributeOptionInput,
  ProductAttributeValue,
  ShapeChoice,
  ShapeQuestion,
  ShapeQuestionInput,
  ShapeTrait,
} from "@rad/types";
export { PRODUCT_ATTRIBUTE_INPUT_TYPES } from "@rad/types";

export type AdminRole = "owner" | "manager" | "editor" | "viewer";
export type AdminSection =
  | "overview"
  | "products"
  | "orders"
  | "messages"
  | "damage"
  | "commissions"
  | "reviews"
  | "shape"
  | "help"
  | "attributes"
  | "users"
  | "members"
  | "account";
export type AdminProductStatus = ProductStatus;

/** Mirrors `ADMIN_CATEGORIES` in `apps/api/src/catalog/category.ts`. */
export const PRODUCT_CATEGORY_LABELS = [
  "گلدان",
  "ظروف",
  "مجسمه",
  "سفال و سرامیک",
  "نقاشی",
  "پارچه و بافت",
  "آثار چوبی",
  "زیورآلات هنری",
  "چاپ دستی و تصویر",
];

/**
 * Store category values (mirrors `STORE_CATEGORIES` in
 * `apps/api/src/catalog/category.ts`) with a Persian label for display.
 * This is what attribute-category assignment (`ProductAttribute.categories`)
 * uses — deliberately not `PRODUCT_CATEGORY_LABELS`: that list is the
 * admin's lossy product-category labels (several labels, e.g. "گلدان" and
 * "ظروف", collapse into the one store value "ceramics"), so storing an
 * attribute against a label that doesn't map back to itself would silently
 * "lose" the assignment on reload. `vases`/`tableware` are omitted — no
 * admin category label reaches them today (see `toStoreCategory`).
 */
export const ATTRIBUTE_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "ceramics", label: "سفال و سرامیک" },
  { value: "sculpture", label: "مجسمه" },
  { value: "painting", label: "نقاشی" },
  { value: "textile", label: "پارچه و بافت" },
  { value: "woodwork", label: "آثار چوبی" },
  { value: "jewelry", label: "زیورآلات هنری" },
  { value: "print", label: "چاپ دستی و تصویر" },
];

export function attributeCategoryLabel(value: string) {
  return (
    ATTRIBUTE_CATEGORY_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}

/**
 * One product image, in the shape the API's save endpoint expects:
 * `legacy_base64`/`static`/`external` round-trip an existing `src`
 * unchanged; `cloudinary`/`seaweedfs` carry only the storage provider's
 * object key (as `objectKey`) the signed upload wrote to — never raw
 * bytes. `src` on one of those entries is a display-only URL the API
 * derived for the editor's `<img>`/`<video>` preview (or a local blob URL
 * while a new upload is in flight) — it is never sent back as the source
 * of truth, `objectKey` is. Which provider is active server-side is
 * decided by `MEDIA_STORAGE_PROVIDER` (see `apps/api/src/storage`) — the
 * admin UI just has to handle whichever kind a successful upload returns.
 */
export type AdminRemoteMediaStorage =
  "cloudinary" | "cloudinary_video" | "seaweedfs" | "seaweedfs_video";

export type AdminProductImage =
  | { storage: "legacy_base64"; src: string; objectKey?: null }
  | { storage: "static" | "external"; src: string; objectKey?: null }
  | {
      storage: AdminRemoteMediaStorage;
      objectKey: string;
      src?: string | null;
    };

const REMOTE_MEDIA_STORAGES: readonly AdminRemoteMediaStorage[] = [
  "cloudinary",
  "cloudinary_video",
  "seaweedfs",
  "seaweedfs_video",
];

/** True for any storage kind backed by a signed-upload provider (as opposed to legacy_base64/static/external). */
export function isRemoteMediaStorage(
  storage: AdminProductImage["storage"],
): storage is AdminRemoteMediaStorage {
  return (REMOTE_MEDIA_STORAGES as readonly string[]).includes(storage);
}

/** True for the video variant of either provider's storage kind. */
export function isVideoStorage(storage: AdminProductImage["storage"]) {
  return storage === "cloudinary_video" || storage === "seaweedfs_video";
}
export type AdminOrderStatus =
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

export type AdminPaymentStatus =
  | "created"
  | "redirected"
  | "submitted"
  | "verified"
  | "rejected"
  | "failed"
  | "verify_error"
  | "verify_conflict";

export type AdminPaymentProvider = "manual_card" | "zarinpal" | "sandbox";

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Short lede shown under the title on the PDP; falls back to the first
   * 48 characters of `description` when left blank. */
  subtitle?: string;
  category: string;
  price: number;
  status: AdminProductStatus;
  /** Same derived field the public API sends; feeds `effectiveProductStatus`. */
  reservedUntil?: number;
  /** Set while a customer's cart or unpaid order holds the work. */
  holdExpiresAt?: number;
  /** A customer holds the work (cart, unpaid order, or receipt awaiting review). */
  held?: boolean;
  artist: string;
  images: AdminProductImage[];
  updatedAt: number;
  /** This product's saved attribute values, keyed by attribute id. */
  attributeValues?: Record<string, ProductAttributeValue>;
}

export interface AdminOrder {
  id: string;
  customer: string;
  phone?: string;
  city?: string;
  address?: string;
  productName: string;
  products: Array<{ slug: string; name: string; radNumber?: number }>;
  amount: number;
  status: AdminOrderStatus;
  /** Postal tracking code once shipped. */
  trackingCode?: string;
  createdAt: number;
  /** `pending_payment` orders expire after this. */
  paymentDueAt?: number;
  paymentProvider?: AdminPaymentProvider;
  paymentStatus?: AdminPaymentStatus;
  paymentAmount?: number;
  receiptImage?: string;
  /** Bank transfer tracking number the customer entered with the receipt. */
  paymentTrackingNumber?: string;
  /** ZarinPal reference number once an online payment is verified. */
  paymentGatewayRefId?: string;
  paymentSubmittedAt?: number;
  receiptSubmissions?: number;
  paymentReviewedAt?: number;
  paymentVerifiedAt?: number;
  rejectionReason?: string;
  /** Stamped when staff mark the order delivered; starts the damage and return windows. */
  deliveredAt?: number;
  /** Rule versions the customer ticked at checkout. */
  policyAcceptance?: PolicyAcceptance;
}

export interface AdminDamageReport extends DamageReport {
  customer: string;
  phone?: string;
  signedIn: boolean;
  deliveredAt?: number;
}

export interface AdminContactMessage {
  id: string;
  topic: ContactTopic;
  source: ContactSource;
  name: string;
  /** Email or phone the customer asked RAD to reply to. */
  contact: string;
  body: string;
  status: ContactMessageStatus;
  orderId?: string;
  /** Set on a reply row — the thread's root message id. Undefined on the root message itself. */
  parentId?: string;
  /** True for a staff reply, false for the customer's own message. */
  fromAdmin: boolean;
  /** False when someone typed an order number that isn't theirs. */
  fromOrderOwner: boolean;
  signedIn: boolean;
  createdAt: number;
  resolvedAt?: number;
}

export interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "invited";
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: "active" | "invited";
  createdAt: number;
}

export type AdminCommissionStage =
  | "design_submitted"
  | "feasibility"
  | "quote"
  | "approval_deposit"
  | "making"
  | "pre_kiln"
  | "firing"
  | "reveal"
  | "shipping"
  | "complete"
  | "declined";

export interface AdminCommissionMessage {
  id: string;
  author: "customer" | "artist" | "system";
  body: { fa: string; en: string };
  createdAt: number;
  internal?: boolean;
  stageId: string;
}

export interface AdminCommission {
  id: string;
  ownerKey: string;
  customerName: string;
  artistName: string;
  stage: AdminCommissionStage;
  nextActor: "customer" | "artist" | "none";
  concept: string;
  intendedUse: string;
  material: string;
  image?: string;
  messages: AdminCommissionMessage[];
  createdAt: number;
  updatedAt: number;
  payload: unknown;
}

export const commissionStageOrder: AdminCommissionStage[] = [
  "design_submitted",
  "feasibility",
  "quote",
  "approval_deposit",
  "making",
  "pre_kiln",
  "firing",
  "reveal",
  "shipping",
  "complete",
];

export const commissionStageLabels: Record<AdminCommissionStage, string> = {
  design_submitted: "طرح ارسال شد",
  feasibility: "بازبینی امکان‌پذیری",
  quote: "پیشنهاد قیمت",
  approval_deposit: "تأیید و بیعانه",
  making: "ساخت",
  pre_kiln: "پیش از کوره",
  firing: "پخت",
  reveal: "رونمایی",
  shipping: "ارسال",
  complete: "تمام",
  declined: "رد شده",
};

export const roleLabels: Record<AdminRole, string> = {
  owner: "مالک",
  manager: "مدیر",
  editor: "ویرایشگر",
  viewer: "مشاهده‌گر",
};

export const orderStatusLabels: Record<AdminOrderStatus, string> = {
  pending_payment: "در انتظار پرداخت",
  pending_verification: "در انتظار تأیید پرداخت",
  confirmed: "پرداخت تأیید شد",
  packing: "در حال بسته‌بندی",
  shipped: "تحویل به پست",
  delivered: "تحویل داده شد",
  expired: "منقضی شد",
  rejected: "پرداخت رد شد",
  cancelled: "لغوشده",
  returned: "مرجوع‌شده",
};

/** Happy path only — expired/rejected/cancel/return are exceptional branches. */
export const orderStatusProgress: AdminOrderStatus[] = [
  "pending_payment",
  "pending_verification",
  "confirmed",
  "packing",
  "shipped",
  "delivered",
];

export function isTerminalOrderStatus(status: AdminOrderStatus) {
  return (
    status === "expired" ||
    status === "rejected" ||
    status === "cancelled" ||
    status === "returned"
  );
}

/**
 * Mirrors `MANUAL_ORDER_TRANSITIONS` in the API. Confirming or rejecting a
 * payment is not a manual status change; it goes through receipt review.
 */
const manualOrderTransitions: Record<AdminOrderStatus, AdminOrderStatus[]> = {
  pending_payment: ["cancelled"],
  pending_verification: ["cancelled"],
  confirmed: ["packing", "shipped", "cancelled"],
  packing: ["confirmed", "shipped", "cancelled"],
  shipped: ["packing", "delivered", "returned"],
  delivered: ["shipped", "returned"],
  expired: [],
  rejected: [],
  cancelled: [],
  returned: [],
};

export function orderStatusOptions(current: AdminOrderStatus) {
  return [current, ...manualOrderTransitions[current]];
}

export const damageStatusLabels: Record<DamageReportStatus, string> = {
  submitted: "تازه",
  reviewing: "در حال بررسی",
  approved: "تأیید شد",
  declined: "تأیید نشد",
};

export const damageResolutionLabels: Record<DamageResolution, string> = {
  repair: "مرمت به دست سازنده",
  refund: "بازگشت کامل مبلغ",
};

export const policyTitleLabels: Record<PolicySlug, string> = {
  buying: "خرید آثار آماده",
  custom: "سفارش اختصاصی",
  shipping: "ارسال و تحویل",
  returns: "مرجوعی و آسیب",
  terms: "شرایط استفاده",
  privacy: "حریم خصوصی",
};

export const contactTopicLabels: Record<ContactTopic, string> = {
  custom: "سفارش اختصاصی",
  order: "پیگیری سفارش",
  payment: "پرداخت و فیش",
  collaboration: "همکاری",
  other: "موضوع دیگر",
};

export const contactSourceLabels: Record<ContactSource, string> = {
  contact: "صفحه‌ی «حرف بزنیم»",
  checkout: "راهنمای تسویه",
  order: "صفحه‌ی سفارش",
};

/** Common reasons staff pick when a receipt does not check out. */
export const paymentRejectionReasons = [
  "مبلغ واریزی با مبلغ سفارش مطابقت ندارد.",
  "رسید خوانا نیست یا مربوط به این سفارش نیست.",
  "واریزی با این شماره پیگیری در حساب رَد دیده نشد.",
  "این رسید قبلاً برای سفارش دیگری استفاده شده است.",
] as const;

const faNumber = new Intl.NumberFormat("fa-IR");

export function stageCountLabel(index: number, total: number) {
  return `مرحله ${faNumber.format(index + 1)} از ${faNumber.format(total)}`;
}

export const productStatusLabels: Record<AdminProductStatus, string> = {
  draft: "پیش‌نویس",
  in_workshop: "در کارگاه",
  ready: "آماده، هنوز عرضه نشده",
  available: "موجود",
  sold: "فروخته شده",
  archived: "آرشیو",
};

const faTime = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function productStatusLabel(product: AdminProduct) {
  const effective = effectiveProductStatus(product);
  if (effective === "reserved") {
    return `در سبد مشتری تا ${faTime.format(product.holdExpiresAt!)}`;
  }
  if (effective === "sold" && product.held) {
    return "فروخته شده · در انتظار تأیید پرداخت";
  }
  return productStatusLabels[product.status];
}

/** Statuses the editor may pick; new products can start anywhere. */
export function productStatusOptions(current?: AdminProductStatus) {
  if (!current) return [...PRODUCT_STATUSES];
  return PRODUCT_STATUSES.filter((status) =>
    canTransitionProductStatus(current, status),
  );
}

export const permissions = {
  owner: [
    "product.write",
    "product.delete",
    "order.write",
    "member.write",
    "content.write",
  ],
  manager: ["product.write", "order.write", "member.write", "content.write"],
  editor: ["product.write", "content.write"],
  viewer: [],
} as const;

export type AdminPermission = (typeof permissions)[AdminRole][number];

export const shapeTraitLabels: Record<ShapeTrait, string> = {
  crooked: "صاف یا کج",
  quiet: "ساکت یا شلوغ",
  worn: "تمیز یا دست‌خورده",
  surprise: "آشنا یا غافلگیرکننده",
  strange: "کاربردی یا عجیب",
};

export const seedMembers: AdminMember[] = [
  {
    id: "member-owner",
    name: "مهدیه نوروزی",
    email: "mahdiyeh.norozi77@gmail.com",
    role: "owner",
    status: "active",
  },
  {
    id: "member-editor",
    name: "سحر میرزایی",
    email: "sahar@rad.studio",
    role: "editor",
    status: "active",
  },
];
