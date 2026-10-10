import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { imageSrc } from "./product.mapper";
import type { ProductImageMeta } from "./type";

/**
 * Pure, no-DB coverage for `imageSrc`'s `cloudinary` branch (Phase 2) and a
 * regression check that `legacy_base64`/`static`/`external` are unchanged.
 */
describe("imageSrc", () => {
  const previousCloudName = process.env.CLOUDINARY_CLOUD_NAME;

  beforeEach(() => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
  });

  afterEach(() => {
    if (previousCloudName === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = previousCloudName;
  });

  function image(overrides: Partial<ProductImageMeta>): ProductImageMeta {
    return {
      id: "img_1",
      alt: "",
      enAlt: "",
      color: null,
      accent: null,
      shape: null,
      sortOrder: 0,
      storage: null,
      objectKey: null,
      src: null,
      ...overrides,
    };
  }

  test("cloudinary row derives its URL from CLOUDINARY_CLOUD_NAME + objectKey (public_id), with f_auto,q_auto baked in", () => {
    process.env.CLOUDINARY_CLOUD_NAME = "rad-cloud";
    const result = imageSrc(
      image({ storage: "cloudinary", objectKey: "rad/products/moon-vase-id/abc123" }),
      false,
    );
    assert.equal(
      result,
      "https://res.cloudinary.com/rad-cloud/image/upload/f_auto,q_auto/rad/products/moon-vase-id/abc123",
    );
  });

  test("cloudinary row without CLOUDINARY_CLOUD_NAME configured falls back to the legacy proxy route", () => {
    const result = imageSrc(
      image({ id: "img_2", storage: "cloudinary", objectKey: "rad/products/moon-vase-id/abc123" }),
      false,
    );
    assert.equal(result, "/catalog/images/img_2");
  });

  test("embedImages always returns the raw src, regardless of storage", () => {
    const result = imageSrc(
      image({ storage: "cloudinary", objectKey: "rad/products/moon-vase-id/abc123", src: "whatever" }),
      true,
    );
    assert.equal(result, "whatever");
  });

  test("regression: static/external rows return src as-is", () => {
    assert.equal(
      imageSrc(image({ storage: "static", src: "/images/static-work.jpg" }), false),
      "/images/static-work.jpg",
    );
    assert.equal(
      imageSrc(image({ storage: "external", src: "https://cdn.example.com/work.jpg" }), false),
      "https://cdn.example.com/work.jpg",
    );
  });

  test("regression: legacy_base64 rows are always masked behind the proxy route", () => {
    assert.equal(
      imageSrc(image({ id: "img_3", storage: "legacy_base64", src: "data:image/png;base64,x" }), false),
      "/catalog/images/img_3",
    );
  });

  test("regression: null storage (pre Phase 0 backfill) also masked behind the proxy route", () => {
    assert.equal(
      imageSrc(image({ id: "img_4", storage: null, src: "data:image/png;base64,x" }), false),
      "/catalog/images/img_4",
    );
  });
});
