import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import {
  BadRequestException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
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
      isValidProductImagePublicId(
        "prod_abc123",
        "rad/products/prod_abc123/abcDEF123",
      ),
      true,
    );
  });

  test("rejects a public_id namespaced under a different product (no forged-reference injection)", () => {
    assert.equal(
      isValidProductImagePublicId(
        "prod_abc123",
        "rad/products/prod_other456/abcDEF123",
      ),
      false,
    );
  });

  test("accepts a rad/pending/ public_id for any productId (pre-creation upload, no id to tie it to yet)", () => {
    assert.equal(
      isValidProductImagePublicId("prod_abc123", "rad/pending/abcDEF123"),
      true,
    );
    assert.equal(
      isValidProductImagePublicId("prod_other456", "rad/pending/abcDEF123"),
      true,
    );
  });

  test("rejects an arbitrary client-supplied public_id outside the expected namespaces", () => {
    assert.equal(
      isValidProductImagePublicId("prod_abc123", "secrets/admin-config"),
      false,
    );
    assert.equal(
      isValidProductImagePublicId(
        "prod_abc123",
        "rad/products/prod_other456/x",
      ),
      false,
    );
    assert.equal(
      isValidProductImagePublicId("prod_abc123", "../../etc/passwd"),
      false,
    );
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
    assert.throws(
      () => storage.createSignedUpload("rad/pending"),
      ServiceUnavailableException,
    );
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

/**
 * `verifyMedia` re-derives provider metadata (format/dimensions/resource
 * type/byte size) from Cloudinary's own `api.resource` lookup rather than
 * trusting the browser — this is the check that stood between a real
 * upload and a 200. These tests stub `cloudinary.api.resource` (the only
 * network call `verifyMedia` makes) to exercise every branch without a
 * live Cloudinary account.
 *
 * The "video with no duration field" case is a regression test for a real
 * bug found in manual testing: Cloudinary's admin `resource` endpoint does
 * not reliably return `duration` for video resources on every
 * plan/account (confirmed empty even with `video_metadata: true` against
 * this project's own Cloudinary account), so `verifyMedia` must not
 * require it.
 */
describe("CloudinaryStorageService.verifyMedia", () => {
  function service() {
    return new CloudinaryStorageService(
      new ConfigService({
        CLOUDINARY_CLOUD_NAME: "rad-cloud",
        CLOUDINARY_API_KEY: "test-api-key",
        CLOUDINARY_API_SECRET: "test-api-secret",
      }),
    );
  }

  function stubResource(
    fn: (publicId: string, options: Record<string, unknown>) => unknown,
  ) {
    const original = cloudinary.api.resource;
    cloudinary.api.resource = fn as typeof cloudinary.api.resource;
    return () => {
      cloudinary.api.resource = original;
    };
  }

  test("accepts a valid jpg image (format + dimensions decoded by Cloudinary)", async () => {
    const restore = stubResource(async () => ({
      resource_type: "image",
      format: "jpg",
      width: 1200,
      height: 900,
      bytes: 168_000,
    }));
    try {
      const result = await service().verifyMedia("rad/pending/abc", "image");
      assert.deepEqual(result, { objectKey: "rad/pending/abc", storage: "cloudinary" });
    } finally {
      restore();
    }
  });

  test("accepts a valid mp4 video even when Cloudinary returns no `duration` field", async () => {
    const restore = stubResource(async () => ({
      resource_type: "video",
      format: "mp4",
      width: 1280,
      height: 720,
      bytes: 1_893_701,
      // deliberately no `duration` key — this is the real shape Cloudinary
      // returned for a genuine uploaded video in manual testing.
    }));
    try {
      const result = await service().verifyMedia("rad/pending/vid1", "video");
      assert.deepEqual(result, { objectKey: "rad/pending/vid1", storage: "cloudinary_video" });
    } finally {
      restore();
    }
  });

  test("accepts a valid video when Cloudinary does report a duration", async () => {
    const restore = stubResource(async () => ({
      resource_type: "video",
      format: "webm",
      width: 640,
      height: 480,
      bytes: 2_000_000,
      duration: 13.4,
    }));
    try {
      const result = await service().verifyMedia("rad/pending/vid2", "video");
      assert.deepEqual(result, { objectKey: "rad/pending/vid2", storage: "cloudinary_video" });
    } finally {
      restore();
    }
  });

  test("rejects when the asset's resource_type doesn't match the claimed kind (image claimed as video, or vice versa)", async () => {
    const restore = stubResource(async () => ({
      resource_type: "image",
      format: "jpg",
      width: 1200,
      height: 900,
      bytes: 168_000,
    }));
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/abc", "video"),
        BadRequestException,
      );
    } finally {
      restore();
    }
  });

  test("rejects a disallowed format even when the bytes decoded as the claimed resource_type", async () => {
    const restore = stubResource(async () => ({
      resource_type: "image",
      format: "bmp",
      width: 1200,
      height: 900,
      bytes: 168_000,
    }));
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/abc", "image"),
        BadRequestException,
      );
    } finally {
      restore();
    }
  });

  test("rejects an asset with zero/missing dimensions (not a real decoded image/video)", async () => {
    const restore = stubResource(async () => ({
      resource_type: "image",
      format: "jpg",
      width: 0,
      height: 0,
      bytes: 168_000,
    }));
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/abc", "image"),
        BadRequestException,
      );
    } finally {
      restore();
    }
  });

  test("rejects a file over the configured size limit for its kind (video over 50MB default)", async () => {
    const restore = stubResource(async () => ({
      resource_type: "video",
      format: "mp4",
      width: 1280,
      height: 720,
      bytes: 60 * 1024 * 1024,
    }));
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/vid3", "video"),
        PayloadTooLargeException,
      );
    } finally {
      restore();
    }
  });

  test("maps a 404 from Cloudinary (asset never uploaded, or deleted) to a client-facing BadRequestException", async () => {
    const restore = stubResource(async () => {
      const error = new Error("not found") as Error & { http_code: number };
      error.http_code = 404;
      throw error;
    });
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/missing", "image"),
        BadRequestException,
      );
    } finally {
      restore();
    }
  });

  test("maps any other Cloudinary API failure to a 503, never leaking the raw error to the client", async () => {
    const restore = stubResource(async () => {
      throw new Error("ECONNRESET");
    });
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/abc", "image"),
        ServiceUnavailableException,
      );
    } finally {
      restore();
    }
  });
});
