export type AdminRole = "owner" | "manager" | "editor" | "viewer";
export type AdminSection = "overview" | "products" | "orders" | "members" | "account";
export type AdminProductStatus = "draft" | "available" | "reserved" | "sold";
export type AdminOrderStatus = "received" | "approved" | "forming" | "drying" | "firing" | "glazing" | "quality" | "shipped" | "delivered";

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: "گلدان" | "ظروف" | "مجسمه";
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
  createdAt: number;
}

export interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "invited";
}

export const roleLabels: Record<AdminRole, string> = {
  owner: "مالک",
  manager: "مدیر",
  editor: "ویرایشگر",
  viewer: "مشاهده‌گر",
};

export const orderStatusLabels: Record<AdminOrderStatus, string> = {
  received: "دریافت شده",
  approved: "تأیید طرح",
  forming: "فرم‌دهی",
  drying: "خشک شدن",
  firing: "پخت اول",
  glazing: "لعاب‌کاری",
  quality: "کنترل کیفیت",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
};

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
  { id: "RAD-408189", customer: "مهدیه نوروزی", productName: "کوزه‌ی سرخ شماره ۲۷", amount: 12800000, status: "forming", createdAt: Date.now() - 86400000 },
  { id: "RAD-385651", customer: "رها احمدی", productName: "حافظه‌ی زیتونی", amount: 9600000, status: "shipped", createdAt: Date.now() - 259200000 },
];

export const seedMembers: AdminMember[] = [
  { id: "member-owner", name: "مهدیه نوروزی", email: "mahdiyeh.norozi77@gmail.com", role: "owner", status: "active" },
  { id: "member-editor", name: "سحر میرزایی", email: "sahar@rad.studio", role: "editor", status: "active" },
];
