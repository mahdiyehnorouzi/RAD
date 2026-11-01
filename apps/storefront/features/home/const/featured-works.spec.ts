import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import type { Product } from "@rad/types";
import { LOCALES } from "@/lib/locale";
import { featuredHomeWorks, liveFeaturedHomeWorks } from "./featured-works";

function product(overrides: Partial<Product> & { slug: string }): Product {
  return {
    name: "",
    subtitle: "",
    price: "",
    usdPrice: 0,
    color: "",
    accent: "",
    shape: "round",
    category: "ceramics",
    status: "available",
    story: "",
    details: [],
    en: { name: "", subtitle: "", story: "", details: [] },
    ...overrides,
  } as Product;
}

test("featuredHomeWorks sorts available works newest-first by listedAt", () => {
  const products = [
    product({ slug: "old", listedAt: 1_000, radNumber: 1 }),
    product({ slug: "newest", listedAt: 3_000, radNumber: 2 }),
    product({ slug: "mid", listedAt: 2_000, radNumber: 3 }),
  ];
  const featured = featuredHomeWorks(products);
  assert.deepEqual(
    featured.map((p) => p.slug),
    ["newest", "mid", "old"],
  );
});

test("featuredHomeWorks breaks a listedAt tie by RAD number, descending", () => {
  const products = [
    product({ slug: "lower-rad", listedAt: 1_000, radNumber: 10 }),
    product({ slug: "higher-rad", listedAt: 1_000, radNumber: 20 }),
  ];
  const featured = featuredHomeWorks(products);
  assert.deepEqual(
    featured.map((p) => p.slug),
    ["higher-rad", "lower-rad"],
  );
});

test("featuredHomeWorks excludes sold, reserved, archived and draft works", () => {
  const products = [
    product({ slug: "available", status: "available", listedAt: 1_000 }),
    product({ slug: "sold", status: "sold", listedAt: 5_000 }),
    product({ slug: "archived", status: "archived", listedAt: 4_000 }),
    product({ slug: "draft", status: "draft", listedAt: 3_000 }),
  ];
  const featured = featuredHomeWorks(products);
  assert.deepEqual(
    featured.map((p) => p.slug),
    ["available"],
  );
});

test("featuredHomeWorks never pads missing slots with ineligible or fake products", () => {
  const products = [product({ slug: "only-one", listedAt: 1_000 })];
  assert.equal(featuredHomeWorks(products).length, 1);
  assert.equal(featuredHomeWorks([]).length, 0);
});

test("featuredHomeWorks caps at 5 even with more eligible works", () => {
  const products = Array.from({ length: 8 }, (_, index) =>
    product({ slug: `work-${index}`, listedAt: index, radNumber: index }),
  );
  assert.equal(featuredHomeWorks(products).length, 5);
});

test("featuredHomeWorks excludes works with no status (bundled registry rows)", () => {
  const products = [
    product({ slug: "live", status: "available", listedAt: 1_000 }),
    product({ slug: "registry", status: undefined, listedAt: 9_000 }),
  ];
  assert.deepEqual(
    featuredHomeWorks(products).map((item) => item.slug),
    ["live"],
  );
});

test("liveFeaturedHomeWorks never publishes registry/demo catalog as Latest Works", () => {
  const products = [
    product({
      slug: "demo-available-shape",
      status: "available",
      listedAt: 5_000,
    }),
    product({ slug: "demo-other", status: undefined, listedAt: 4_000 }),
  ];
  assert.deepEqual(liveFeaturedHomeWorks(products, "registry"), []);
  assert.deepEqual(
    liveFeaturedHomeWorks(products, "api").map((item) => item.slug),
    ["demo-available-shape"],
  );
});

test("production-shaped API catalog: /fa and /en Latest Works are the five newest available works", () => {
  const products = [
    product({ slug: "two-rings", status: "available", listedAt: 9_000 }),
    product({ slug: "chik-chikak", status: "available", listedAt: 8_000 }),
    product({ slug: "flamingo", status: "available", listedAt: 7_000 }),
    product({ slug: "apricot", status: "available", listedAt: 6_000 }),
    product({ slug: "abi-bigharar", status: "available", listedAt: 5_000 }),
    product({ slug: "older-available", status: "available", listedAt: 1_000 }),
    product({ slug: "sold-work", status: "sold", listedAt: 20_000 }),
    product({
      slug: "reserved-hold",
      status: "sold",
      reservedUntil: Date.now() + 900_000,
      listedAt: 19_000,
    }),
    product({ slug: "archived-work", status: "archived", listedAt: 18_000 }),
    product({ slug: "draft-work", status: "draft", listedAt: 17_000 }),
    product({ slug: "workshop-work", status: "in_workshop", listedAt: 16_000 }),
    product({ slug: "ready-work", status: "ready", listedAt: 15_000 }),
    ...Array.from({ length: 14 }, (_, index) =>
      product({
        slug: `available-older-${index}`,
        status: "available",
        listedAt: 2_000 + index,
      }),
    ),
  ];
  assert.equal(products.length, 26);
  const expected = [
    "two-rings",
    "chik-chikak",
    "flamingo",
    "apricot",
    "abi-bigharar",
  ];
  for (const locale of LOCALES) {
    assert.equal(locale === "fa" || locale === "en", true);
    assert.deepEqual(
      liveFeaturedHomeWorks(products, "api").map((item) => item.slug),
      expected,
      `${locale} Latest Works`,
    );
  }
});

test("homepage is force-dynamic and only publishes liveFeaturedHomeWorks", () => {
  const source = readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../../../app/[locale]/page.tsx",
    ),
    "utf8",
  );
  assert.match(source, /export const dynamic = "force-dynamic"/);
  assert.match(source, /liveFeaturedHomeWorks/);
  assert.doesNotMatch(source, /featuredHomeWorks\(/);
});
