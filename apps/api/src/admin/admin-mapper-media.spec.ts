import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { toAdminProduct } from "./admin.mapper";
import type { Product, ProductImage, Vendor } from "../database/entities";

/**
 * Pure, no-DB coverage for `toAdminProduct`'s image `src` derivation —
 * regression for the SeaweedFS admin preview bug (seaweedfs/seaweedfs_video
 * rows were returned with their persisted `null` `src` instead of a derived
 * display URL, unlike cloudinary/cloudinary_video).
 */
describe("toAdminProduct — image src derivation", () => {
  const previousSeaweedfsUrl = process.env.SEAWEEDFS_PUBLIC_URL;
  const previousCloudName = process.env.CLOUDINARY_CLOUD_NAME;

  beforeEach(() => {
    process.env.SEAWEEDFS_PUBLIC_URL = "https://media.example.com/rad-media";
    process.env.CLOUDINARY_CLOUD_NAME = "rad-cloud";
  });

  afterEach(() => {
    if (previousSeaweedfsUrl === undefined)
      delete process.env.SEAWEEDFS_PUBLIC_URL;
    else process.env.SEAWEEDFS_PUBLIC_URL = previousSeaweedfsUrl;
    if (previousCloudName === undefined)
      delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = previousCloudName;
  });

  function image(overrides: Partial<ProductImage>): ProductImage {
    return {
      id: "img_1",
      productSlug: "moon-vase",
      alt: "",
      enAlt: "",
      color: null,
      accent: null,
      shape: null,
      src: null,
      storage: null,
      objectKey: null,
      sortOrder: 0,
      product: undefined as unknown as ProductImage["product"],
      ...overrides,
    } as ProductImage;
  }

  function product(
    images: ProductImage[],
    vendor: Vendor | null = null,
  ): Product & { images: ProductImage[]; vendor: Vendor | null } {
    return {
      id: "prod_1",
      slug: "moon-vase",
      name: "کوزه ماه",
      story: "داستان",
      category: "گلدان",
      tomanPrice: 1_000_000,
      status: "available",
      holdExpiresAt: null,
      heldBy: null,
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      images,
      vendor,
    } as unknown as Product & { images: ProductImage[]; vendor: Vendor | null };
  }

  test("seaweedfs image derives a public display src from objectKey, preserving storage/objectKey", () => {
    const objectKey = "rad/products/prod_1/abc123";
    const result = toAdminProduct(
      product([image({ storage: "seaweedfs", objectKey, src: null })]),
    );
    assert.equal(
      result.images[0].src,
      "https://media.example.com/rad-media/rad/products/prod_1/abc123",
    );
    assert.equal(result.images[0].storage, "seaweedfs");
    assert.equal(result.images[0].objectKey, objectKey);
  });

  test("seaweedfs_video image derives a public display src from objectKey", () => {
    const objectKey = "rad/products/prod_1/clip456";
    const result = toAdminProduct(
      product([image({ storage: "seaweedfs_video", objectKey, src: null })]),
    );
    assert.equal(
      result.images[0].src,
      "https://media.example.com/rad-media/rad/products/prod_1/clip456",
    );
    assert.equal(result.images[0].storage, "seaweedfs_video");
    assert.equal(result.images[0].objectKey, objectKey);
  });

  test("regression: cloudinary image still derives its src from objectKey", () => {
    const objectKey = "rad/products/prod_1/xyz789";
    const result = toAdminProduct(
      product([image({ storage: "cloudinary", objectKey, src: null })]),
    );
    assert.equal(
      result.images[0].src,
      "https://res.cloudinary.com/rad-cloud/image/upload/rad/products/prod_1/xyz789",
    );
    assert.equal(result.images[0].objectKey, objectKey);
  });

  test("regression: legacy_base64 image keeps its persisted data-URL src as-is", () => {
    const base64 = "data:image/png;base64,abc";
    const result = toAdminProduct(
      product([image({ storage: "legacy_base64", src: base64 })]),
    );
    assert.equal(result.images[0].src, base64);
    assert.equal(result.images[0].storage, "legacy_base64");
  });

  test("regression: static image keeps its persisted src path as-is", () => {
    const result = toAdminProduct(
      product([image({ storage: "static", src: "/catalog/test.jpg" })]),
    );
    assert.equal(result.images[0].src, "/catalog/test.jpg");
    assert.equal(result.images[0].storage, "static");
  });

  test("seaweedfs image with no SEAWEEDFS_PUBLIC_URL/ENDPOINT configured falls back to the proxy route, never the stored null", () => {
    delete process.env.SEAWEEDFS_PUBLIC_URL;
    const result = toAdminProduct(
      product([
        image({ id: "img_9", storage: "seaweedfs", objectKey: "rad/x/y" }),
      ]),
    );
    assert.equal(result.images[0].src, "/catalog/images/img_9");
  });
});
