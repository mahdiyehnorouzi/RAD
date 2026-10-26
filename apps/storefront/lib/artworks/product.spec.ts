import assert from "node:assert/strict";
import { test } from "node:test";
import type { Artwork } from "@rad/types";
import { commerceProducts, shopProducts } from "./product";

const work = {
  slug: "persisted-work",
  title: { fa: "ظرف", en: "Vessel" },
  description: { fa: "", en: "" },
  story: { fa: "", en: "" },
  artist: {
    id: "rad",
    name: { fa: "رَد", en: "RAD" },
    kind: "rad",
    verified: true,
  },
  materials: {},
  category: "ceramics",
  status: "sold",
  reservedUntil: Date.now() + 900_000,
  price: 2600000,
  usdPrice: 30,
  images: [],
} as unknown as Artwork;

test("reserved persisted product remains resolvable by cart when discovery excludes its media", () => {
  for (const images of [
    [],
    [{ src: "/catalog/older-photo.webp", alt: "اثر" }],
  ]) {
    const record = { ...work, images } as Artwork;
    assert.equal(shopProducts([record]).length, 0);
    const product = commerceProducts([record])[0];
    assert.equal(product.slug, record.slug);
    assert.equal(product.reservedUntil, record.reservedUntil);
    assert.equal(product.status, record.status);
    assert.equal(product.images?.length, images.length);
  }
});

test("commerce lookup never invents unpriced products or substitutes registry data", () => {
  assert.deepEqual(commerceProducts([]), []);
  assert.deepEqual(commerceProducts([{ ...work, price: null }]), []);
});
