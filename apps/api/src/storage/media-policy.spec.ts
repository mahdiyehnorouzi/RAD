import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { PayloadTooLargeException } from "@nestjs/common";
import { mediaLimits, validateMediaSize } from "./media-policy";

describe("mediaLimits", () => {
  test("the product image limit is 3MB", () => {
    assert.equal(mediaLimits().image, 3 * 1024 * 1024);
  });
});

describe("validateMediaSize (image)", () => {
  const MB = 1024 * 1024;

  test("accepts a 2.7MB image (a typical ChatGPT-generated image)", () => {
    assert.doesNotThrow(() => validateMediaSize(Math.round(2.7 * MB), "image"));
  });

  test("accepts a 2.9MB image", () => {
    assert.doesNotThrow(() => validateMediaSize(Math.round(2.9 * MB), "image"));
  });

  test("accepts an image at exactly the 3MB limit", () => {
    assert.doesNotThrow(() => validateMediaSize(3 * MB, "image"));
  });

  test("rejects an image over 3MB", () => {
    assert.throws(
      () => validateMediaSize(3 * MB + 1, "image"),
      PayloadTooLargeException,
    );
  });
});
