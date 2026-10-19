import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
  UPLOAD_INTENT_MAX_AGE_MS,
  __resetIssuedS3UploadsForTests,
  checkIssuedS3Upload,
  recordIssuedS3Upload,
} from "./s3-upload-intent";

describe("checkIssuedS3Upload", () => {
  afterEach(() => {
    __resetIssuedS3UploadsForTests();
  });

  test("returns 'unknown' for a key never recorded", () => {
    assert.equal(checkIssuedS3Upload("rad/pending/never-recorded", null, "image"), "unknown");
  });

  test("returns 'unknown' for a key whose intent has expired, even though it was never swept — expiry is checked on every read, not just on the next write", () => {
    const expiredAt = Date.now() - UPLOAD_INTENT_MAX_AGE_MS - 1000;
    recordIssuedS3Upload("rad/pending/old", null, "image", expiredAt);
    // No other write happens here — sweepExpired only ever runs inside
    // recordIssuedS3Upload, so without a per-read expiry check this
    // would incorrectly still report "match" forever.
    assert.equal(checkIssuedS3Upload("rad/pending/old", null, "image"), "unknown");
  });

  test("a record just under the max age still matches", () => {
    const stillFresh = Date.now() - UPLOAD_INTENT_MAX_AGE_MS + 5_000;
    recordIssuedS3Upload("rad/pending/fresh", null, "image", stillFresh);
    assert.equal(checkIssuedS3Upload("rad/pending/fresh", null, "image"), "match");
  });

  test("returns 'match' when productId and kind both match what was recorded", () => {
    recordIssuedS3Upload("rad/products/prod_1/abc", "prod_1", "image");
    assert.equal(checkIssuedS3Upload("rad/products/prod_1/abc", "prod_1", "image"), "match");
  });

  test("returns 'mismatch' when the kind differs (image recorded, video claimed)", () => {
    recordIssuedS3Upload("rad/pending/abc", null, "image");
    assert.equal(checkIssuedS3Upload("rad/pending/abc", null, "video"), "mismatch");
  });

  test("returns 'mismatch' when a key minted for a real product is claimed by a different real product", () => {
    recordIssuedS3Upload("rad/products/prod_1/abc", "prod_1", "image");
    assert.equal(checkIssuedS3Upload("rad/products/prod_1/abc", "prod_2", "image"), "mismatch");
  });

  test("a PENDING intent (productId null at sign time) matches any productId claimed later — the pre-creation-upload lifecycle", () => {
    recordIssuedS3Upload("rad/pending/abc", null, "image");
    assert.equal(checkIssuedS3Upload("rad/pending/abc", null, "image"), "match");
    assert.equal(checkIssuedS3Upload("rad/pending/abc", "prod_1", "image"), "match");
    assert.equal(checkIssuedS3Upload("rad/pending/abc", "prod_2", "image"), "match");
  });

  test("does not mutate state on read — checking twice gives the same result (verify may legitimately run more than once)", () => {
    recordIssuedS3Upload("rad/pending/abc", null, "image");
    assert.equal(checkIssuedS3Upload("rad/pending/abc", null, "image"), "match");
    assert.equal(checkIssuedS3Upload("rad/pending/abc", null, "image"), "match");
  });

  test("re-recording the same key overwrites its prior intent", () => {
    recordIssuedS3Upload("rad/pending/abc", null, "image");
    recordIssuedS3Upload("rad/pending/abc", "prod_1", "video");
    assert.equal(checkIssuedS3Upload("rad/pending/abc", "prod_1", "video"), "match");
    assert.equal(checkIssuedS3Upload("rad/pending/abc", "prod_2", "video"), "mismatch");
  });

  test("simulated API restart: the in-memory map being empty (as it would be after a fresh process start) reads as 'unknown', never as a match", () => {
    recordIssuedS3Upload("rad/pending/abc", null, "image");
    __resetIssuedS3UploadsForTests(); // models the module's state after a restart
    assert.equal(checkIssuedS3Upload("rad/pending/abc", null, "image"), "unknown");
  });
});
