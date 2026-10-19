import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
  __resetIssuedS3UploadsForTests,
  checkIssuedS3Upload,
  recordIssuedS3Upload,
} from "./s3-upload-intent";

describe("checkIssuedS3Upload", () => {
  afterEach(() => {
    __resetIssuedS3UploadsForTests();
  });

  test("returns 'unknown' for a key never recorded (soft signal, not a rejection)", () => {
    assert.equal(checkIssuedS3Upload("rad/pending/never-recorded", null, "image"), "unknown");
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
});
