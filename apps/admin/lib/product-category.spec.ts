import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminCategory } from "@rad/types";
import type { AdminProduct } from "./admin-data";
import {
  alignProductCategory,
  keptSubcategory,
  parentSlugForProduct,
} from "./product-category";

const ceramics: AdminCategory = {
  id: "cat-ceramics",
  slug: "ceramics",
  parentId: null,
  name: { fa: "سفال و سرامیک", en: "Ceramics" },
  active: true,
  sortOrder: 0,
  productCount: 2,
  children: [
    {
      id: "cat-mugs",
      slug: "mugs",
      parentId: "cat-ceramics",
      name: { fa: "ماگ", en: "Mugs" },
      active: true,
      sortOrder: 0,
      productCount: 1,
      children: [],
    },
  ],
};

const painting: AdminCategory = {
  id: "cat-painting",
  slug: "painting",
  parentId: null,
  name: { fa: "نقاشی", en: "Painting" },
  active: true,
  sortOrder: 1,
  productCount: 0,
  children: [],
};

const categories = [ceramics, painting];

function product(overrides: Partial<AdminProduct> = {}): AdminProduct {
  return {
    id: "p1",
    slug: "moon-vase",
    name: "گلدان ماه",
    description: "توضیح",
    category: "سفال و سرامیک",
    categorySlug: "ceramics",
    subcategory: "mugs",
    price: 1,
    status: "available",
    artist: "استودیو رَد",
    images: [],
    updatedAt: 0,
    ...overrides,
  };
}

test("a stored parent slug and subcategory are restored", () => {
  const aligned = alignProductCategory(product(), categories, false);
  assert.equal(aligned.categorySlug, "ceramics");
  assert.equal(aligned.subcategory, "mugs");
  assert.equal(aligned.category, "سفال و سرامیک");
});

test("a legacy product without a subcategory stays without one", () => {
  const aligned = alignProductCategory(
    product({
      category: "گلدان",
      categorySlug: undefined,
      subcategory: null,
    }),
    categories,
    false,
  );
  assert.equal(aligned.categorySlug, "ceramics");
  assert.equal(aligned.subcategory, null);
});

test("changing the parent clears a subcategory from the previous parent", () => {
  assert.equal(keptSubcategory("painting", "mugs", categories), null);
  assert.equal(keptSubcategory("ceramics", "mugs", categories), "mugs");
});

test("an unknown stored slug is kept when the category list has not arrived", () => {
  assert.equal(
    parentSlugForProduct(
      product({ categorySlug: "lighting", category: "lighting" }),
      [],
    ),
    "lighting",
  );
});
