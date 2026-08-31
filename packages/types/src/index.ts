export type Locale = "fa" | "en";
export type ProductShape = "tall" | "round" | "wide";
export type ProductVisual =
  | "vessel"
  | "painting"
  | "textile"
  | "wood"
  | "sculpture"
  | "jewelry"
  | "print";
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
  en: { name: string; subtitle: string; story: string; details: string[] };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "artist" | "admin";
  adminRole?: "owner" | "manager" | "editor" | "viewer" | null;
}
export type OrderStatus =
  | "received"
  | "approved"
  | "forming"
  | "drying"
  | "firing"
  | "glazing"
  | "quality"
  | "shipped"
  | "delivered";
export interface Order {
  id: string;
  slugs: string[];
  total: number;
  usdTotal?: number;
  createdAt: number;
  status: OrderStatus;
  delivery: { name: string; city: string };
}
export interface Review { id: string; productSlug: string; author: string; rating: number; comment: string; image?: string; createdAt: number; }
export interface PaymentIntent { id: string; orderId: string; amount: number; currency: "IRR" | "USD"; provider: "sandbox" | "zarinpal"; status: "created" | "redirected" | "verified" | "failed"; }
export type NoticeKind = "favorite" | "cart" | "welcome" | "order";
export interface Notice { id: string; kind: NoticeKind; productSlug?: string; read: boolean; createdAt: number; }
export interface CartSnapshot { slugs: string[]; }
