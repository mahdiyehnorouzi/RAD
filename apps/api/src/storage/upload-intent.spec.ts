import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
  UPLOAD_INTENT_MAX_AGE_MS,
  __resetIssuedUploadsForTests,
  checkIssuedUpload,
  recordIssuedUpload,
} from "./upload-intent";

describe("checkIssuedUpload", () => {
  afterEach(() => {
    __resetIssuedUploadsForTests();
  });

  test("returns 'unknown' for a key never recorded", () => {
    assert.equal(checkIssuedUpload("rad/pending/never-recorded", null, "image"), "unknown");
  });

  test("returns 'match' when productId and kind both match what was recorded", () => {
    recordIssuedUpload("rad/products/prod_1/abc", "prod_1", "image");
    assert.equal(checkIssuedUpload("rad/products/prod_1/abc", "prod_1", "image"), "match");
  });

  test("returns 'mismatch' when the kind differs (image recorded, video claimed)", () => {
    recordIssuedUpload("rad/pending/abc", null, "image");
    assert.equal(checkIssuedUpload("rad/pending/abc", null, "video"), "mismatch");
  });

  test("returns 'mismatch' when a key minted for a real product is claimed by a different real product", () => {
    recordIssuedUpload("rad/products/prod_1/abc", "prod_1", "image");
    assert.equal(checkIssuedUpload("rad/products/prod_1/abc", "prod_2", "image"), "mismatch");
  });

  test("a PENDING intent (productId null at sign time) matches any productId claimed later", () => {
    recordIssuedUpload("rad/pending/abc", null, "image");
    assert.equal(checkIssuedUpload("rad/pending/abc", null, "image"), "match");
    assert.equal(checkIssuedUpload("rad/pending/abc", "prod_1", "image"), "match");
    assert.equal(checkIssuedUpload("rad/pending/abc", "prod_2", "image"), "match");
  });

  test("does not mutate state on read — checking twice gives the same result", () => {
    recordIssuedUpload("rad/pending/abc", null, "image");
    assert.equal(checkIssuedUpload("rad/pending/abc", null, "image"), "match");
    assert.equal(checkIssuedUpload("rad/pending/abc", null, "image"), "match");
  });

  test("returns 'unknown' for a key whose intent has expired, even though it was never swept — expiry is checked on every read", () => {
    const expiredAt = Date.now() - UPLOAD_INTENT_MAX_AGE_MS - 1000;
    recordIssuedUpload("rad/pending/old", null, "image", expiredAt);
    assert.equal(checkIssuedUpload("rad/pending/old", null, "image"), "unknown");
  });

  test("simulated API restart: an empty map (as it would be after a fresh process start) reads as 'unknown', never a match", () => {
    recordIssuedUpload("rad/pending/abc", null, "image");
    __resetIssuedUploadsForTests();
    assert.equal(checkIssuedUpload("rad/pending/abc", null, "image"), "unknown");
  });
});
