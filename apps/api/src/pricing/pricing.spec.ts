import assert from "node:assert/strict";
import test from "node:test";
import { extractPage } from "./extract";
import { scoreComparable } from "./match";
import { parsePrice } from "./normalize";
import { recommendPrice } from "./policy";
import type { CatalogProduct, Comparable, PricingConfig } from "./types";

const product: CatalogProduct = {
  id: "1",
  slug: "bowl",
  name: "کاسه سرامیکی انار",
  subtitle: "لعاب قرمز",
  category: "ceramics",
  story: "کاسه دست ساز",
  details: ["قطر ۳۰ سانتی متر"],
  tomanPrice: 5_000_000,
  status: "available",
};
const config: PricingConfig = {
  sources: [],
  minimumComparables: 3,
  minimumConfidence: 0.4,
  maximumChangePercent: 40,
  roundToToman: 100_000,
};

test("normalizes Persian digits and rial into toman", () =>
  assert.equal(parsePrice("۱۲٬۵۰۰٬۰۰۰ ریال", "IRR"), 1_250_000));
test("extracts schema.org products", () => {
  const html =
    '<script type="application/ld+json">{"@type":"Product","name":"کاسه سرامیکی","description":"قطر ۳۰ سانتی متر","offers":{"price":"4500000"}}</script>';
  const result = extractPage(html, "https://shop.example/item", {
    name: "shop",
    startUrls: [],
    allowedHosts: ["shop.example"],
    currency: "IRT",
  });
  assert.equal(result.products[0].priceToman, 4_500_000);
});
test("scores same-category and dimension comparables", () => {
  const comparable: Comparable = {
    source: "x",
    url: "https://x.test",
    name: "کاسه سفالی قرمز",
    category: "ظروف سرامیک",
    features: ["قطر ۳۰ سانتی متر"],
    priceToman: 5_000_000,
  };
  assert.ok(scoreComparable(product, comparable).score >= 0.55);
});
test("recommends median only when enough comparable data exists", () => {
  const candidates = [4_800_000, 5_200_000, 5_000_000].map(
    (priceToman, index) => ({
      source: "x",
      url: `https://x.test/${index}`,
      name: "کاسه سرامیکی انار",
      category: "سرامیک",
      features: ["لعاب قرمز", "قطر ۳۰ سانتی متر"],
      priceToman,
    }),
  );
  const result = recommendPrice(product, candidates, config);
  assert.equal(result.status, "recommended");
  assert.equal(result.recommendedPriceToman, 5_000_000);
});
