import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";
import {
  CloudinaryStorageService,
  isAllowedProductImageMime,
  isValidProductImagePublicId,
  productImageFolder,
} from "./cloudinary-storage.service";

describe("isAllowedProductImageMime", () => {
  test("allows jpeg/png/webp only", () => {
    assert.equal(isAllowedProductImageMime("image/jpeg"), true);
    assert.equal(isAllowedProductImageMime("image/png"), true);
    assert.equal(isAllowedProductImageMime("image/webp"), true);
    assert.equal(isAllowedProductImageMime("image/gif"), false);
    assert.equal(isAllowedProductImageMime("application/pdf"), false);
    assert.equal(isAllowedProductImageMime("text/html"), false);
  });
});

describe("productImageFolder", () => {
  test("namespaces by the immutable productId when given", () => {
    assert.equal(productImageFolder("prod_abc123"), "rad/products/prod_abc123");
  });

  test("falls back to the unassociated rad/pending folder when productId is null (pre-creation upload)", () => {
    assert.equal(productImageFolder(null), "rad/pending");
  });
});

describe("isValidProductImagePublicId", () => {
  test("accepts a public_id under the product's own folder", () => {
    assert.equal(
      isValidProductImagePublicId("prod_abc123", "rad/products/prod_abc123/abcDEF123"),
      true,
    );
  });

  test("rejects a public_id namespaced under a different product (no forged-reference injection)", () => {
    assert.equal(
      isValidProductImagePublicId("prod_abc123", "rad/products/prod_other456/abcDEF123"),
      false,
    );
  });

  test("accepts a rad/pending/ public_id for any productId (pre-creation upload, no id to tie it to yet)", () => {
    assert.equal(isValidProductImagePublicId("prod_abc123", "rad/pending/abcDEF123"), true);
    assert.equal(isValidProductImagePublicId("prod_other456", "rad/pending/abcDEF123"), true);
  });

  test("rejects an arbitrary client-supplied public_id outside the expected namespaces", () => {
    assert.equal(isValidProductImagePublicId("prod_abc123", "secrets/admin-config"), false);
    assert.equal(
      isValidProductImagePublicId("prod_abc123", "rad/products/prod_other456/x"),
      false,
    );
    assert.equal(isValidProductImagePublicId("prod_abc123", "../../etc/passwd"), false);
  });
});

/**
 * Signature verification against Cloudinary's own documented algorithm
 * (https://cloudinary.com/documentation/signatures#how_to_generate_a_signature):
 * sort every to-be-signed param alphabetically by key, join as
 * `key=value` pairs with `&`, append the API secret directly (no
 * separator), SHA-1 hex digest the result. This test recomputes that
 * digest by hand, independently of `CloudinaryStorageService`/the
 * Cloudinary SDK, so it is not just testing the SDK against itself.
 */
describe("CloudinaryStorageService.createSignedUpload", () => {
  function service(env: Record<string, string>) {
    return new CloudinaryStorageService(new ConfigService(env));
  }

  test("throws when Cloudinary config is missing (never silently signs with empty credentials)", () => {
    const storage = service({});
    assert.throws(() => storage.createSignedUpload("rad/pending"), InternalServerErrorException);
  });

  test("signature matches an independently-computed SHA-1 digest of the sorted params + secret", () => {
    const storage = service({
      CLOUDINARY_CLOUD_NAME: "rad-cloud",
      CLOUDINARY_API_KEY: "test-api-key",
      CLOUDINARY_API_SECRET: "test-api-secret",
    });
    const result = storage.createSignedUpload("rad/products/prod_1");

    const expectedToSign = `folder=${result.folder}&timestamp=${result.timestamp}`;
    const expectedSignature = createHash("sha1")
      .update(`${expectedToSign}test-api-secret`)
      .digest("hex");

    assert.equal(result.signature, expectedSignature);
    assert.equal(result.cloudName, "rad-cloud");
    assert.equal(result.apiKey, "test-api-key");
    assert.equal(result.folder, "rad/products/prod_1");
    assert.equal(typeof result.timestamp, "number");
  });

  test("never returns the API secret itself", () => {
    const storage = service({
      CLOUDINARY_CLOUD_NAME: "rad-cloud",
      CLOUDINARY_API_KEY: "test-api-key",
      CLOUDINARY_API_SECRET: "super-secret-value",
    });
    const result = storage.createSignedUpload("rad/pending");
    assert.equal(JSON.stringify(result).includes("super-secret-value"), false);
  });

  test("two signed uploads a second apart (different timestamps) produce different signatures", async () => {
    const storage = service({
      CLOUDINARY_CLOUD_NAME: "rad-cloud",
      CLOUDINARY_API_KEY: "test-api-key",
      CLOUDINARY_API_SECRET: "test-api-secret",
    });
    const first = storage.createSignedUpload("rad/pending");
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const second = storage.createSignedUpload("rad/pending");
    assert.notEqual(first.timestamp, second.timestamp);
    assert.notEqual(first.signature, second.signature);
  });
});
