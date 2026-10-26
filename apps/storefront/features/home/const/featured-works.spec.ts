import assert from "node:assert/strict";
import { test } from "node:test";
import type { Product } from "@rad/types";
import { featuredHomeWorks } from "./featured-works";

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

test("featuredHomeWorks orders the newest-listed work first, not the lowest radNumber", () => {
  const oldest = product({ slug: "oldest", listedAt: 1, radNumber: 1 });
  const newest = product({ slug: "newest", listedAt: 3, radNumber: 3 });
  const middle = product({ slug: "middle", listedAt: 2, radNumber: 2 });

  // Public catalog order (radNumber ascending) would put `oldest` first.
  const result = featuredHomeWorks([oldest, middle, newest]);

  assert.deepEqual(
    result.map((product) => product.slug),
    ["newest", "middle", "oldest"],
  );
});

test("a scarce (sold/gone) work still fills the last slot, after sorting", () => {
  const gone = product({ slug: "gone", status: "sold", listedAt: 5 });
  const a = product({ slug: "a", listedAt: 1 });
  const b = product({ slug: "b", listedAt: 2 });

  const result = featuredHomeWorks([a, b, gone]);

  assert.deepEqual(
    result.map((product) => product.slug),
    ["b", "a", "gone"],
  );
});
