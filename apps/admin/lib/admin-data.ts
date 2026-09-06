export type AdminRole = "owner" | "manager" | "editor" | "viewer";
export type AdminSection = "overview" | "products" | "orders" | "commissions" | "members" | "account";
export type AdminProductStatus = "draft" | "available" | "reserved" | "sold";
export type AdminOrderStatus =
  | "payment_pending"
  | "confirmed"
  | "packing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  status: AdminProductStatus;
  artist: string;
  images: string[];
  updatedAt: number;
}

export interface AdminOrder {
  id: string;
  customer: string;
  productName: string;
  amount: number;
  status: AdminOrderStatus;
  trackingCode?: string;
  createdAt: number;
}

export interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "invited";
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
  payment_pending: "در انتظار پرداخت",
  confirmed: "سفارش ثبت شد",
  packing: "در حال بسته‌بندی",
  shipped: "تحویل به پست",
  delivered: "تحویل داده شد",
  cancelled: "لغوشده",
  returned: "مرجوع‌شده",
};

const faNumber = new Intl.NumberFormat("fa-IR");

export function stageCountLabel(index: number, total: number) {
  return `مرحله ${faNumber.format(index + 1)} از ${faNumber.format(total)}`;
}

export const productStatusLabels: Record<AdminProductStatus, string> = {
  draft: "پیش‌نویس",
  available: "موجود",
  reserved: "رزرو شده",
  sold: "فروخته شده",
};

export const permissions = {
  owner: ["product.write", "product.delete", "order.write", "member.write"],
  manager: ["product.write", "order.write", "member.write"],
  editor: ["product.write"],
  viewer: [],
} as const;

export const seedProducts: AdminProduct[] = [
  { id: "rad-027", slug: "red-vessel-27", name: "کوزه‌ی سرخ شماره ۲۷", description: "کوزه‌ای یکتا با لعاب خاکستر و اکسید آهن؛ ساخته‌شده و امضاشده در استودیوی رَد.", category: "گلدان", price: 12800000, status: "available", artist: "استودیو رَد", images: ["/rad-icon.svg"], updatedAt: Date.now() },
  { id: "rad-028", slug: "olive-memory", name: "حافظه‌ی زیتونی", description: "فرمی آرام و متراکم با سطح مات برای نگه‌داشتن نور و شاخه‌های کوتاه.", category: "گلدان", price: 9600000, status: "reserved", artist: "سحر میرزایی", images: ["/rad-icon.svg", "/rad-logo.png"], updatedAt: Date.now() - 86400000 },
  { id: "rad-029", slug: "lut-line", name: "خط لوت", description: "پرسلان شنی با لبه‌ی نامتقارن؛ قطعه‌ای میان ظرف روزمره و مجسمه.", category: "ظروف", price: 15400000, status: "draft", artist: "استودیو رَد", images: [], updatedAt: Date.now() - 172800000 },
];

export const seedOrders: AdminOrder[] = [
  { id: "RAD-408189", customer: "مهدیه نوروزی", productName: "کوزه‌ی سرخ شماره ۲۷", amount: 12800000, status: "packing", createdAt: Date.now() - 86400000 },
  { id: "RAD-385651", customer: "رها احمدی", productName: "حافظه‌ی زیتونی", amount: 9600000, status: "shipped", trackingCode: "RAD-POST-3856", createdAt: Date.now() - 259200000 },
];

export const seedMembers: AdminMember[] = [
  { id: "member-owner", name: "مهدیه نوروزی", email: "mahdiyeh.norozi77@gmail.com", role: "owner", status: "active" },
  { id: "member-editor", name: "سحر میرزایی", email: "sahar@rad.studio", role: "editor", status: "active" },
];
