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
  const previousSeaweedfsUrl = process.env.SEAWEEDFS_PUBLIC_URL;
  const previousSeaweedfsEndpoint = process.env.SEAWEEDFS_ENDPOINT;
  const previousSeaweedfsBucket = process.env.SEAWEEDFS_BUCKET;

  beforeEach(() => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.SEAWEEDFS_PUBLIC_URL;
    delete process.env.SEAWEEDFS_ENDPOINT;
    delete process.env.SEAWEEDFS_BUCKET;
  });

  afterEach(() => {
    if (previousCloudName === undefined)
      delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = previousCloudName;
    if (previousSeaweedfsUrl === undefined)
      delete process.env.SEAWEEDFS_PUBLIC_URL;
    else process.env.SEAWEEDFS_PUBLIC_URL = previousSeaweedfsUrl;
    if (previousSeaweedfsEndpoint === undefined)
      delete process.env.SEAWEEDFS_ENDPOINT;
    else process.env.SEAWEEDFS_ENDPOINT = previousSeaweedfsEndpoint;
    if (previousSeaweedfsBucket === undefined)
      delete process.env.SEAWEEDFS_BUCKET;
    else process.env.SEAWEEDFS_BUCKET = previousSeaweedfsBucket;
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
      image({
        storage: "cloudinary",
        objectKey: "rad/products/moon-vase-id/abc123",
      }),
      false,
    );
    assert.equal(
      result,
      "https://res.cloudinary.com/rad-cloud/image/upload/rad/products/moon-vase-id/abc123",
    );
  });

  test("cloudinary row without CLOUDINARY_CLOUD_NAME configured falls back to the legacy proxy route", () => {
    const result = imageSrc(
      image({
        id: "img_2",
        storage: "cloudinary",
        objectKey: "rad/products/moon-vase-id/abc123",
      }),
      false,
    );
    assert.equal(result, "/catalog/images/img_2");
  });

  test("embedImages always returns the raw src, regardless of storage", () => {
    const result = imageSrc(
      image({
        storage: "cloudinary",
        objectKey: "rad/products/moon-vase-id/abc123",
        src: "whatever",
      }),
      true,
    );
    assert.equal(result, "whatever");
  });

  test("seaweedfs row derives its URL from SEAWEEDFS_PUBLIC_URL + objectKey", () => {
    process.env.SEAWEEDFS_PUBLIC_URL = "https://media.example.com/rad-media";
    const result = imageSrc(
      image({
        storage: "seaweedfs",
        objectKey: "rad/products/moon-vase-id/abc123",
      }),
      false,
    );
    assert.equal(
      result,
      "https://media.example.com/rad-media/rad/products/moon-vase-id/abc123",
    );
  });

  test("seaweedfs row falls back to SEAWEEDFS_ENDPOINT + SEAWEEDFS_BUCKET when no public URL is set", () => {
    process.env.SEAWEEDFS_ENDPOINT = "http://seaweedfs.internal:8333";
    process.env.SEAWEEDFS_BUCKET = "rad-media";
    const result = imageSrc(
      image({ storage: "seaweedfs_video", objectKey: "rad/pending/xyz" }),
      false,
    );
    assert.equal(
      result,
      "http://seaweedfs.internal:8333/rad-media/rad/pending/xyz",
    );
  });

  test("seaweedfs row without any SeaweedFS config falls back to the legacy proxy route", () => {
    const result = imageSrc(
      image({
        id: "img_5",
        storage: "seaweedfs",
        objectKey: "rad/products/moon-vase-id/abc123",
      }),
      false,
    );
    assert.equal(result, "/catalog/images/img_5");
  });

  test("regression: static/external rows return src as-is", () => {
    assert.equal(
      imageSrc(
        image({ storage: "static", src: "/images/static-work.jpg" }),
        false,
      ),
      "/images/static-work.jpg",
    );
    assert.equal(
      imageSrc(
        image({ storage: "external", src: "https://cdn.example.com/work.jpg" }),
        false,
      ),
      "https://cdn.example.com/work.jpg",
    );
  });

  test("regression: legacy_base64 rows are always masked behind the proxy route", () => {
    assert.equal(
      imageSrc(
        image({
          id: "img_3",
          storage: "legacy_base64",
          src: "data:image/png;base64,x",
        }),
        false,
      ),
      "/catalog/images/img_3",
    );
  });

  test("regression: null storage (pre Phase 0 backfill) also masked behind the proxy route", () => {
    assert.equal(
      imageSrc(
        image({ id: "img_4", storage: null, src: "data:image/png;base64,x" }),
        false,
      ),
      "/catalog/images/img_4",
    );
  });
});
