import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { imageSrc, toCatalogImages } from "./product.mapper";
import type { ProductImageMeta } from "./type";

/**
 * Pure, no-DB coverage for `imageSrc`/`toCatalogImages`'s `s3`/`s3_video`
 * branches (PR 3) — mirrors `product-mapper-cloudinary.spec.ts`'s
 * structure. Nothing here depends on `S3StorageService` or any network
 * call; it only exercises `product.mapper.ts`'s pure URL-building logic.
 */
describe("imageSrc — s3", () => {
  const previousBaseUrl = process.env.S3_PUBLIC_MEDIA_BASE_URL;

  beforeEach(() => {
    delete process.env.S3_PUBLIC_MEDIA_BASE_URL;
  });

  afterEach(() => {
    if (previousBaseUrl === undefined) delete process.env.S3_PUBLIC_MEDIA_BASE_URL;
    else process.env.S3_PUBLIC_MEDIA_BASE_URL = previousBaseUrl;
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

  const VALID_PRODUCT_KEY = `rad/products/prod_abc123/${"a".repeat(32)}`;
  const VALID_PENDING_KEY = `rad/pending/${"b".repeat(32)}`;

  test("s3 row builds a stable HTTPS URL from S3_PUBLIC_MEDIA_BASE_URL + objectKey", () => {
    process.env.S3_PUBLIC_MEDIA_BASE_URL = "https://media.rad-object.com";
    const result = imageSrc(image({ storage: "s3", objectKey: VALID_PRODUCT_KEY }), false);
    assert.equal(result, `https://media.rad-object.com/${VALID_PRODUCT_KEY}`);
  });

  test("s3_video row builds the same shape of URL as s3 (no separate video path segment)", () => {
    process.env.S3_PUBLIC_MEDIA_BASE_URL = "https://media.rad-object.com";
    const result = imageSrc(
      image({ storage: "s3_video", objectKey: VALID_PRODUCT_KEY }),
      false,
    );
    assert.equal(result, `https://media.rad-object.com/${VALID_PRODUCT_KEY}`);
  });

  test("a trailing slash on the configured base URL is normalized away (no double slash)", () => {
    process.env.S3_PUBLIC_MEDIA_BASE_URL = "https://media.rad-object.com/";
    const result = imageSrc(image({ storage: "s3", objectKey: VALID_PRODUCT_KEY }), false);
    assert.equal(result, `https://media.rad-object.com/${VALID_PRODUCT_KEY}`);
  });

  test("a rad/pending/ key (pre-save upload) also resolves correctly", () => {
    process.env.S3_PUBLIC_MEDIA_BASE_URL = "https://media.rad-object.com";
    const result = imageSrc(image({ storage: "s3", objectKey: VALID_PENDING_KEY }), false);
    assert.equal(result, `https://media.rad-object.com/${VALID_PENDING_KEY}`);
  });

  test("s3 row with no S3_PUBLIC_MEDIA_BASE_URL configured falls back to the legacy proxy route, never an internal endpoint", () => {
    const result = imageSrc(
      image({ id: "img_2", storage: "s3", objectKey: VALID_PRODUCT_KEY }),
      false,
    );
    assert.equal(result, "/catalog/images/img_2");
  });

  test("never falls back to an internal S3 endpoint even if one were somehow set on the same process", () => {
    process.env.S3_PUBLIC_MEDIA_BASE_URL = "";
    process.env.S3_ENDPOINT = "http://127.0.0.1:8333"; // unrelated internal var; must never leak into a public URL
    const result = imageSrc(
      image({ id: "img_5", storage: "s3", objectKey: VALID_PRODUCT_KEY }),
      false,
    );
    assert.equal(result, "/catalog/images/img_5");
    delete process.env.S3_ENDPOINT;
  });

  test("malformed object key (path traversal attempt) never reaches URL construction — falls back to the safe proxy route", () => {
    process.env.S3_PUBLIC_MEDIA_BASE_URL = "https://media.rad-object.com";
    const result = imageSrc(
      image({ id: "img_3", storage: "s3", objectKey: "../../etc/passwd" }),
      false,
    );
    assert.equal(result, "/catalog/images/img_3");
  });

  test("malformed object key (wrong charset / injected characters) is also rejected", () => {
    process.env.S3_PUBLIC_MEDIA_BASE_URL = "https://media.rad-object.com";
    const result = imageSrc(
      image({
        id: "img_4",
        storage: "s3",
        objectKey: "rad/products/prod_abc123/<script>alert(1)</script>",
      }),
      false,
    );
    assert.equal(result, "/catalog/images/img_4");
  });

  test("an object key claiming a product namespace but with a short/forged token is rejected", () => {
    process.env.S3_PUBLIC_MEDIA_BASE_URL = "https://media.rad-object.com";
    const result = imageSrc(
      image({ id: "img_6", storage: "s3", objectKey: "rad/products/prod_abc123/short" }),
      false,
    );
    assert.equal(result, "/catalog/images/img_6");
  });

  test("embedImages always returns the raw src, regardless of s3 storage", () => {
    const result = imageSrc(
      image({ storage: "s3", objectKey: VALID_PRODUCT_KEY, src: "whatever" }),
      true,
    );
    assert.equal(result, "whatever");
  });

  test("regression: cloudinary/static/external/legacy_base64 rows are completely unaffected by the s3 branch existing", () => {
    assert.equal(
      imageSrc(image({ storage: "static", src: "/images/static-work.jpg" }), false),
      "/images/static-work.jpg",
    );
    assert.equal(
      imageSrc(
        image({
          id: "img_7",
          storage: "legacy_base64",
          src: "data:image/png;base64,x",
        }),
        false,
      ),
      "/catalog/images/img_7",
    );
  });
});

describe("toCatalogImages — s3", () => {
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

  test("s3_video is classified as kind 'video', same as cloudinary_video", () => {
    const [result] = toCatalogImages(
      [image({ storage: "s3_video", objectKey: "rad/pending/" + "c".repeat(32) })],
      true,
      true,
    );
    assert.equal(result.kind, "video");
  });

  test("s3_video is excluded from the default (includeVideos=false) listing, same as cloudinary_video", () => {
    const result = toCatalogImages(
      [image({ storage: "s3_video", objectKey: "rad/pending/" + "c".repeat(32) })],
      true,
      false,
    );
    assert.equal(result.length, 0);
  });

  test("s3 rows never get a thumbnail (no resize capability yet, unlike cloudinary)", () => {
    const [result] = toCatalogImages(
      [image({ storage: "s3", objectKey: "rad/pending/" + "c".repeat(32) })],
      true,
    );
    assert.equal(result.thumbnail, undefined);
  });
});
