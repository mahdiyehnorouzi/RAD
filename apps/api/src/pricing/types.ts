export type SourceSelectors = {
  card?: string;
  link?: string;
  name?: string;
  price?: string;
  category?: string;
  features?: string;
  next?: string;
};
export type PriceSource = {
  name: string;
  startUrls: string[];
  allowedHosts: string[];
  currency: "IRR" | "IRT";
  selectors?: SourceSelectors;
};
export type PricingConfig = {
  sources: PriceSource[];
  userAgent?: string;
  delayMs?: number;
  maxPagesPerSource?: number;
  minimumComparables?: number;
  minimumConfidence?: number;
  priceMultiplier?: number;
  roundToToman?: number;
  maximumChangePercent?: number;
};
export type Comparable = {
  source: string;
  url: string;
  name: string;
  category?: string;
  features: string[];
  priceToman: number;
};
export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  category: string;
  story: string;
  details: unknown;
  tomanPrice: number;
  status: string;
};
export type ScoredComparable = Comparable & {
  score: number;
  reasons: string[];
};
export type Recommendation = {
  productId: string;
  slug: string;
  productName: string;
  currentPriceToman: number;
  recommendedPriceToman: number | null;
  confidence: number;
  status: "recommended" | "insufficient-data" | "change-cap-exceeded";
  comparables: ScoredComparable[];
};
