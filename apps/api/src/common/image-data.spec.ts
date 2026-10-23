import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { assertImageData, imageDataBytes, productImageError, productImageLimit } from "./image-data";

function dataUrlOfSize(bytes: number) {
  // base64 encodes 3 bytes as 4 chars, so (bytes/3)*4 chars (rounded) yields `bytes` after decoding.
  const base64Length = Math.ceil(bytes / 3) * 4;
  return `data:image/jpeg;base64,${"A".repeat(base64Length)}`;
}

describe("productImageLimit", () => {
  test("is 3MB", () => {
    assert.equal(productImageLimit, 3 * 1024 * 1024);
  });
});

describe("assertImageData (product image boundary)", () => {
  const MB = 1024 * 1024;

  test("accepts a 2.7MB image", () => {
    assert.doesNotThrow(() =>
      assertImageData(dataUrlOfSize(2.7 * MB), productImageLimit, productImageError),
    );
  });

  test("accepts a 2.9MB image", () => {
    assert.doesNotThrow(() =>
      assertImageData(dataUrlOfSize(2.9 * MB), productImageLimit, productImageError),
    );
  });

  test("accepts an image at exactly 3MB", () => {
    assert.doesNotThrow(() =>
      assertImageData(dataUrlOfSize(3 * MB), productImageLimit, productImageError),
    );
  });

  test("rejects an image over 3MB", () => {
    assert.throws(() =>
      assertImageData(dataUrlOfSize(3 * MB + 100), productImageLimit, productImageError),
    );
  });
});

describe("imageDataBytes", () => {
  test("estimates decoded byte length from base64 payload length", () => {
    const bytes = imageDataBytes(dataUrlOfSize(1024));
    assert.ok(Math.abs(bytes - 1024) < 4);
  });
});
