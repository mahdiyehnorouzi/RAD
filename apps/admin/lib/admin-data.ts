import {
  PRODUCT_STATUSES,
  canTransitionProductStatus,
  type ContactMessageStatus,
  type ContactSource,
  type ContactTopic,
  type DamageReport,
  type DamageReportStatus,
  type DamageResolution,
  type PolicyAcceptance,
  type PolicySlug,
  type ProductStatus,
  type ShapeTrait,
} from "@rad/types";

export type {
  AdminReview,
  HelpQuestion,
  HelpQuestionInput,
  ShapeChoice,
  ShapeQuestion,
  ShapeQuestionInput,
  ShapeTrait,
} from "@rad/types";

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
  | "users"
  | "members"
  | "account";
export type AdminProductStatus = ProductStatus;

/**
 * One product image, in the shape the API's save endpoint expects:
 * `legacy_base64`/`static`/`external` round-trip an existing `src`
 * unchanged; `cloudinary` carries only the Cloudinary `public_id` (as
 * `objectKey`) the signed upload wrote to — never raw bytes. `src` on a
 * `cloudinary` entry is a display-only URL the API derived for the
 * editor's `<img>` preview (or a local blob URL while a new upload is in
 * flight) — it is never sent back as the source of truth, `objectKey` is.
 */
export type AdminProductImage =
  | { storage: "legacy_base64"; src: string; objectKey?: null }
  | { storage: "static" | "external"; src: string; objectKey?: null }
  | { storage: "cloudinary"; objectKey: string; src?: string | null };
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
  | "failed";

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  status: AdminProductStatus;
  /** Set while a customer's cart or unpaid order holds the work. */
  holdExpiresAt?: number;
  /** A customer holds the work (cart, unpaid order, or receipt awaiting review). */
  held?: boolean;
  artist: string;
  images: AdminProductImage[];
  updatedAt: number;
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
  paymentStatus?: AdminPaymentStatus;
  paymentAmount?: number;
  receiptImage?: string;
  /** Bank transfer tracking number the customer entered with the receipt. */
  paymentTrackingNumber?: string;
  paymentSubmittedAt?: number;
  receiptSubmissions?: number;
  paymentReviewedAt?: number;
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

const faTime = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" });

export function productStatusLabel(product: AdminProduct) {
  if (product.holdExpiresAt) {
    return `در سبد مشتری تا ${faTime.format(product.holdExpiresAt)}`;
  }
  if (product.held) return "فروخته شده · در انتظار تأیید پرداخت";
  return productStatusLabels[product.status];
}

/** Statuses the editor may pick; new products can start anywhere. */
export function productStatusOptions(current?: AdminProductStatus) {
  if (!current) return [...PRODUCT_STATUSES];
  return PRODUCT_STATUSES.filter((status) => canTransitionProductStatus(current, status));
}

export const permissions = {
  owner: ["product.write", "product.delete", "order.write", "member.write", "content.write"],
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
