import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  isValidProductImagePublicId,
  productImageFolder,
} from "./cloudinary-storage.service";
import { isValidS3ObjectKey, mintS3ObjectKey } from "./s3-object-key";

/**
 * PR 3 — design validation for Task 3 (ownership/object-key
 * authorization), run against the real, already-shipped functions rather
 * than a mock: proves `isValidS3ObjectKey` provides the SAME ownership
 * guarantees `AdminService` already relies on `isValidProductImagePublicId`
 * for, so wiring it into `AdminService.verifyProductMedia`/`saveProduct`
 * (a later PR — not done here) is a drop-in substitution, not a new
 * authorization model.
 *
 * `S3StorageService.verifyMedia` is deliberately not used anywhere in
 * this file — authorization is `isValidS3ObjectKey`'s job alone (see
 * `media-storage.interface.ts`'s doc comment on `verifyMedia`).
 */
describe("isValidS3ObjectKey has the same ownership semantics as isValidProductImagePublicId", () => {
  test("both accept a key correctly namespaced under the given product", () => {
    const productId = "prod_abc123";
    const cloudinaryKey = `${productImageFolder(productId)}/token123`;
    const s3Key = mintS3ObjectKey(productImageFolder(productId));
    assert.equal(isValidProductImagePublicId(productId, cloudinaryKey), true);
    assert.equal(isValidS3ObjectKey(productId, s3Key), true);
  });

  test("both reject a key namespaced under a DIFFERENT product (cross-product claiming)", () => {
    const owner = "prod_abc123";
    const other = "prod_other456";
    const cloudinaryKey = `${productImageFolder(other)}/token123`;
    const s3Key = mintS3ObjectKey(productImageFolder(other));
    assert.equal(isValidProductImagePublicId(owner, cloudinaryKey), false);
    assert.equal(isValidS3ObjectKey(owner, s3Key), false);
  });

  test("both accept the unassociated rad/pending/ namespace for any product (pre-save uploads)", () => {
    const cloudinaryKey = `${productImageFolder(null)}/token123`;
    const s3Key = mintS3ObjectKey(productImageFolder(null));
    for (const productId of ["prod_abc123", "prod_other456", "unsaved"]) {
      assert.equal(isValidProductImagePublicId(productId, cloudinaryKey), true);
      assert.equal(isValidS3ObjectKey(productId, s3Key), true);
    }
  });

  test("both reject an arbitrary, non-namespaced client-supplied key (no traversal, no forged top-level paths)", () => {
    const productId = "prod_abc123";
    for (const forged of ["secrets/admin-config", "../../etc/passwd", "rad/other/x"]) {
      assert.equal(isValidProductImagePublicId(productId, forged), false);
      assert.equal(isValidS3ObjectKey(productId, forged), false);
    }
  });

  test("divergence, by design: isValidS3ObjectKey additionally enforces the exact 32-char minted-token shape, while isValidProductImagePublicId accepts any non-empty token", () => {
    const productId = "prod_abc123";
    const shortToken = `${productImageFolder(productId)}/short`;
    // Cloudinary's own existence check (verifyMedia hitting Cloudinary's
    // Admin API) is the real security boundary for a Cloudinary key, so a
    // loosely-shaped but non-existent public_id is harmless — it just
    // 404s later. An S3 key has no such secondary existence-authority
    // check backing it the same way (the object trivially "exists" once
    // someone PUTs to it) — unpredictability of the key itself is the
    // real guarantee, so isValidS3ObjectKey is deliberately stricter.
    assert.equal(isValidProductImagePublicId(productId, shortToken), true);
    assert.equal(isValidS3ObjectKey(productId, shortToken), false);
  });
});
