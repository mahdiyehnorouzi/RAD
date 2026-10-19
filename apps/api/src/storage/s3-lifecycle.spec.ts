import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  DEFAULT_PENDING_UPLOAD_MAX_AGE_MS,
  isAbandonedPendingUpload,
} from "./s3-lifecycle";

describe("isAbandonedPendingUpload", () => {
  test("a rad/pending/ object older than the max age is abandoned", () => {
    const now = new Date("2026-01-02T01:00:00Z");
    const lastModified = new Date("2026-01-01T00:00:00Z"); // 25h old
    assert.equal(
      isAbandonedPendingUpload("rad/pending/abc", lastModified, now),
      true,
    );
  });

  test("a rad/pending/ object within the max age is not abandoned", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const lastModified = new Date("2026-01-01T00:00:00Z"); // 12h old
    assert.equal(
      isAbandonedPendingUpload("rad/pending/abc", lastModified, now),
      false,
    );
  });

  test("a namespaced product object is never considered abandoned by this check, regardless of age", () => {
    const now = new Date("2030-01-01T00:00:00Z");
    const lastModified = new Date("2020-01-01T00:00:00Z");
    assert.equal(
      isAbandonedPendingUpload("rad/products/prod_1/abc", lastModified, now),
      false,
    );
  });

  test("respects a custom max age override", () => {
    const now = new Date("2026-01-01T01:00:00Z");
    const lastModified = new Date("2026-01-01T00:00:00Z"); // 1h old
    assert.equal(
      isAbandonedPendingUpload("rad/pending/abc", lastModified, now, 30 * 60 * 1000),
      true,
    );
    assert.equal(
      isAbandonedPendingUpload("rad/pending/abc", lastModified, now, 2 * 60 * 60 * 1000),
      false,
    );
  });

  test("default max age is 24 hours", () => {
    assert.equal(DEFAULT_PENDING_UPLOAD_MAX_AGE_MS, 24 * 60 * 60 * 1000);
  });
});
