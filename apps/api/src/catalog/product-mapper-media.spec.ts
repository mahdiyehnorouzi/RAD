import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { imageSrc } from "./product.mapper";
import type { ProductImageMeta } from "./type";

describe("imageSrc", () => {
  const previousPublicUrl = process.env.SEAWEEDFS_PUBLIC_URL;
  const previousEndpoint = process.env.SEAWEEDFS_ENDPOINT;
  const previousBucket = process.env.SEAWEEDFS_BUCKET;

  beforeEach(() => {
    delete process.env.SEAWEEDFS_PUBLIC_URL;
    delete process.env.SEAWEEDFS_ENDPOINT;
    delete process.env.SEAWEEDFS_BUCKET;
  });

  afterEach(() => {
    if (previousPublicUrl === undefined)
      delete process.env.SEAWEEDFS_PUBLIC_URL;
    else process.env.SEAWEEDFS_PUBLIC_URL = previousPublicUrl;
    if (previousEndpoint === undefined) delete process.env.SEAWEEDFS_ENDPOINT;
    else process.env.SEAWEEDFS_ENDPOINT = previousEndpoint;
    if (previousBucket === undefined) delete process.env.SEAWEEDFS_BUCKET;
    else process.env.SEAWEEDFS_BUCKET = previousBucket;
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

  test("S3-backed image resolves from the configured public URL", () => {
    process.env.SEAWEEDFS_PUBLIC_URL =
      "https://api.rad-object.com/storage/rad-public";
    assert.equal(
      imageSrc(
        image({ storage: "seaweedfs", objectKey: "rad/products/p1/a1" }),
        false,
      ),
      "https://api.rad-object.com/storage/rad-public/rad/products/p1/a1",
    );
  });

  test("S3-backed image falls back to endpoint plus bucket", () => {
    process.env.SEAWEEDFS_ENDPOINT = "http://127.0.0.1:8333";
    process.env.SEAWEEDFS_BUCKET = "rad-public";
    assert.equal(
      imageSrc(
        image({ storage: "seaweedfs_video", objectKey: "rad/pending/v1" }),
        false,
      ),
      "http://127.0.0.1:8333/rad-public/rad/pending/v1",
    );
  });

  test("legacy, static, external, and embedded sources keep their existing behavior", () => {
    assert.equal(
      imageSrc(image({ storage: "static", src: "/catalog/a.jpg" }), false),
      "/catalog/a.jpg",
    );
    assert.equal(
      imageSrc(
        image({ storage: "external", src: "https://example.com/a.jpg" }),
        false,
      ),
      "https://example.com/a.jpg",
    );
    assert.equal(
      imageSrc(image({ storage: "legacy_base64" }), false),
      "/catalog/images/img_1",
    );
    assert.equal(
      imageSrc(image({ storage: "seaweedfs", src: "preview" }), true),
      "preview",
    );
  });
});
