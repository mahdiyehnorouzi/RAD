import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { VerifyProductMediaDto } from "./verify-product-media.dto";

/**
 * PR 3 audit finding: `VerifyProductMediaDto.objectKey`'s regex
 * (`^rad\/(pending|products\/[A-Za-z0-9_-]+)\/[A-Za-z0-9_-]+$`) was
 * already provider-agnostic — it was never Cloudinary-specific, so an
 * S3-shaped key (`rad/products/<id>/<32-char token>`) already passes this
 * DTO's shape check today, with no change needed here. This is
 * deliberately NOT a security gap: `AdminService.verifyProductMedia`
 * still calls `isValidProductImagePublicId` (equally provider-agnostic in
 * shape) and then `this.storage.verifyMedia(...)`, and the only storage
 * provider wired into `StorageModule` is `CloudinaryStorageService` —
 * which will reject a real S3-shaped key as "not found" the moment it
 * calls Cloudinary's Admin API with it, since no such public_id was ever
 * actually uploaded there. The DTO's permissiveness is therefore already
 * safe; what's missing for a wired-in S3 provider is `AdminService`
 * calling `isValidS3ObjectKey` (stricter — see `ownership-parity.spec.ts`)
 * instead of/alongside `isValidProductImagePublicId`, not a DTO change.
 */
describe("VerifyProductMediaDto — objectKey shape", () => {
  test("already accepts an S3-shaped object key (same rad/products/<id>/<token> convention)", async () => {
    const dto = plainToInstance(VerifyProductMediaDto, {
      objectKey: `rad/products/prod_1/${"a".repeat(32)}`,
      kind: "image",
    });
    const errors = await validate(dto);
    assert.equal(errors.length, 0);
  });

  test("already accepts an S3-shaped pending-upload key", async () => {
    const dto = plainToInstance(VerifyProductMediaDto, {
      objectKey: `rad/pending/${"a".repeat(32)}`,
      kind: "video",
    });
    const errors = await validate(dto);
    assert.equal(errors.length, 0);
  });

  test("still rejects a key outside the rad/ namespace entirely", async () => {
    const dto = plainToInstance(VerifyProductMediaDto, {
      objectKey: "secrets/admin-config",
      kind: "image",
    });
    const errors = await validate(dto);
    assert.ok(errors.some((error) => error.property === "objectKey"));
  });

  test("still rejects a path-traversal attempt", async () => {
    const dto = plainToInstance(VerifyProductMediaDto, {
      objectKey: "../../etc/passwd",
      kind: "image",
    });
    const errors = await validate(dto);
    assert.ok(errors.some((error) => error.property === "objectKey"));
  });
});
