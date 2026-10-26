import assert from "node:assert/strict";
import { test } from "node:test";
import type { Product } from "@rad/types";
import { defaultCatalogFilters } from "./filters";
import { refineCatalog } from "./refine";

function product(overrides: Partial<Product> & { slug: string }): Product {
  return {
    name: overrides.slug,
    subtitle: "",
    price: "1000000",
    usdPrice: 10,
    color: "#000",
    accent: "#fff",
    shape: "tall",
    category: "ceramics",
    status: "available",
    story: "",
    details: [],
    en: { name: "", subtitle: "", story: "", details: [] },
    ...overrides,
  };
}

test("availability sort puts in-stock works before sold/gone ones, newest first within each group", () => {
  const soldOlder = product({
    slug: "sold-older",
    status: "sold",
    listedAt: 1,
  });
  const availableOlder = product({
    slug: "available-older",
    status: "available",
    listedAt: 2,
  });
  const availableNewer = product({
    slug: "available-newer",
    status: "available",
    listedAt: 3,
  });
  const soldNewer = product({
    slug: "sold-newer",
    status: "sold",
    listedAt: 4,
  });

  const result = refineCatalog(
    [soldOlder, availableOlder, availableNewer, soldNewer],
    { ...defaultCatalogFilters, sort: "availability" },
    "en",
  );

  assert.deepEqual(
    result.map((product) => product.slug),
    ["available-newer", "available-older", "sold-newer", "sold-older"],
  );
});
