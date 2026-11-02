import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { toCatalogImages } from "./product.mapper";
import type { ProductImageMeta } from "./type";

function image(overrides: Partial<ProductImageMeta>): ProductImageMeta {
  return {
    id: "img_1",
    alt: "",
    enAlt: "",
    color: null,
    accent: null,
    shape: null,
    sortOrder: 0,
    storage: "static",
    objectKey: null,
    src: "/images/a.jpg",
    ...overrides,
  };
}

describe("public catalog cover image", () => {
  test("the lowest sortOrder still image is the first public image (cover)", () => {
    const catalog = toCatalogImages([
      image({ id: "b", src: "/images/b.jpg", sortOrder: 1 }),
      image({ id: "a", src: "/images/a.jpg", sortOrder: 0 }),
    ]);
    assert.equal(catalog[0].src, "/images/a.jpg");
    assert.equal(catalog[1].src, "/images/b.jpg");
  });

  test("video never becomes the public cover even when it has sortOrder 0", () => {
    const catalog = toCatalogImages([
      image({
        id: "vid",
        storage: "cloudinary_video",
        objectKey: "clip",
        src: null,
        sortOrder: 0,
      }),
      image({
        id: "cover",
        storage: "static",
        src: "/images/cover.jpg",
        sortOrder: 1,
      }),
      image({
        id: "extra",
        storage: "static",
        src: "/images/extra.jpg",
        sortOrder: 2,
      }),
    ]);
    assert.equal(catalog[0].src, "/images/cover.jpg");
    assert.equal(catalog.length, 2);
    assert.ok(catalog.every((item) => item.kind === "image"));
  });

  test("reordering so a later image is sortOrder 0 updates the public cover and keeps the rest", () => {
    const before = toCatalogImages([
      image({ id: "one", src: "/images/one.jpg", sortOrder: 0 }),
      image({ id: "two", src: "/images/two.jpg", sortOrder: 1 }),
      image({ id: "three", src: "/images/three.jpg", sortOrder: 2 }),
    ]);
    assert.equal(before[0].src, "/images/one.jpg");

    const after = toCatalogImages([
      image({ id: "one", src: "/images/one.jpg", sortOrder: 1 }),
      image({ id: "two", src: "/images/two.jpg", sortOrder: 2 }),
      image({ id: "three", src: "/images/three.jpg", sortOrder: 0 }),
    ]);
    assert.deepEqual(
      after.map((item) => item.src),
      ["/images/three.jpg", "/images/one.jpg", "/images/two.jpg"],
    );
  });
});
