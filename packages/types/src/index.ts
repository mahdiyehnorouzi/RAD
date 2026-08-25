export type Locale = "fa" | "en";
export type ProductShape = "tall" | "round" | "wide";
export type ProductCategory = "vases" | "tableware" | "sculpture";
export type ProductStatus = "draft" | "review" | "available" | "reserved" | "sold";

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
  status?: ProductStatus;
  story: string;
  details: string[];
  images?: ProductImage[];
  vendor?: Vendor;
  en: { name: string; subtitle: string; story: string; details: string[] };
}

export interface AuthUser { id: string; name: string; email: string; role: "customer" | "artist" | "admin"; }
export interface Order { id: string; slugs: string[]; total: number; usdTotal?: number; createdAt: number; status: "received"; delivery: { name: string; city: string }; }
export interface Review { id: string; productSlug: string; author: string; rating: number; comment: string; image?: string; createdAt: number; }
export interface PaymentIntent { id: string; orderId: string; amount: number; currency: "IRR" | "USD"; provider: "sandbox" | "zarinpal"; status: "created" | "redirected" | "verified" | "failed"; }
