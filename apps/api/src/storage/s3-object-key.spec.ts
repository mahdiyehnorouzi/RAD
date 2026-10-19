import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  isValidS3ObjectKey,
  mintS3ObjectKey,
  mintS3ObjectToken,
} from "./s3-object-key";

describe("mintS3ObjectToken", () => {
  test("produces a 32-character base64url token (192 bits of randomness)", () => {
    const token = mintS3ObjectToken();
    assert.match(token, /^[A-Za-z0-9_-]{32}$/);
  });

  test("two tokens are never equal", () => {
    assert.notEqual(mintS3ObjectToken(), mintS3ObjectToken());
  });
});

describe("mintS3ObjectKey", () => {
  test("namespaces under the given folder", () => {
    const key = mintS3ObjectKey("rad/products/prod_1");
    assert.match(key, /^rad\/products\/prod_1\/[A-Za-z0-9_-]{32}$/);
  });
});

describe("isValidS3ObjectKey", () => {
  test("accepts a key minted under the product's own folder", () => {
    const key = mintS3ObjectKey("rad/products/prod_abc123");
    assert.equal(isValidS3ObjectKey("prod_abc123", key), true);
  });

  test("rejects a key minted under a different product's folder (no cross-product claiming)", () => {
    const key = mintS3ObjectKey("rad/products/prod_other456");
    assert.equal(isValidS3ObjectKey("prod_abc123", key), false);
  });

  test("accepts a rad/pending/ key for any productId (pre-creation upload)", () => {
    const key = mintS3ObjectKey("rad/pending");
    assert.equal(isValidS3ObjectKey("prod_abc123", key), true);
    assert.equal(isValidS3ObjectKey("prod_other456", key), true);
  });

  test("rejects an arbitrary client-supplied key outside the expected namespaces", () => {
    assert.equal(isValidS3ObjectKey("prod_abc123", "secrets/admin-config"), false);
    assert.equal(isValidS3ObjectKey("prod_abc123", "../../etc/passwd"), false);
    assert.equal(isValidS3ObjectKey("prod_abc123", "rad/products/prod_other456/x"), false);
  });

  test("rejects a key with the right prefix but a forged/short token (not one of ours)", () => {
    assert.equal(isValidS3ObjectKey("prod_abc123", "rad/products/prod_abc123/short"), false);
    assert.equal(
      isValidS3ObjectKey("prod_abc123", "rad/products/prod_abc123/' OR 1=1"),
      false,
    );
  });
});
