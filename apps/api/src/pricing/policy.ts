import { findComparables } from "./match";
import type {
  CatalogProduct,
  Comparable,
  PricingConfig,
  Recommendation,
} from "./types";

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

export function recommendPrice(
  product: CatalogProduct,
  candidates: Comparable[],
  config: PricingConfig,
): Recommendation {
  const matches = findComparables(product, candidates);
  const minimum = config.minimumComparables ?? 3;
  const confidence = matches.length
    ? Number(
        (
          matches.reduce((sum, item) => sum + item.score, 0) / matches.length
        ).toFixed(4),
      )
    : 0;
  const base = {
    productId: product.id,
    slug: product.slug,
    productName: product.name,
    currentPriceToman: product.tomanPrice,
    confidence,
    comparables: matches,
  };
  if (
    matches.length < minimum ||
    confidence < (config.minimumConfidence ?? 0.42)
  )
    return {
      ...base,
      recommendedPriceToman: null,
      status: "insufficient-data",
    };
  const raw =
    median(matches.map((item) => item.priceToman)) *
    (config.priceMultiplier ?? 1);
  const step = config.roundToToman ?? 100_000;
  const recommendedPriceToman = Math.max(step, Math.round(raw / step) * step);
  const change =
    (Math.abs(recommendedPriceToman - product.tomanPrice) /
      product.tomanPrice) *
    100;
  if (change > (config.maximumChangePercent ?? 35))
    return { ...base, recommendedPriceToman, status: "change-cap-exceeded" };
  return { ...base, recommendedPriceToman, status: "recommended" };
}
