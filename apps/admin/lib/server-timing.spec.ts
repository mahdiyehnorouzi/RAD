import { test } from "node:test";
import assert from "node:assert/strict";
import { parseServerTimingDuration } from "./server-timing";

test("parseServerTimingDuration reads a single metric", () => {
  assert.equal(parseServerTimingDuration("proxy;dur=42.5", "proxy"), 42.5);
});

test("parseServerTimingDuration picks the named metric out of several", () => {
  assert.equal(
    parseServerTimingDuration("db;dur=5, proxy;dur=120, cache;dur=1", "proxy"),
    120,
  );
});

test("parseServerTimingDuration returns undefined when the header is missing", () => {
  assert.equal(parseServerTimingDuration(null, "proxy"), undefined);
});

test("parseServerTimingDuration returns undefined when the metric isn't present", () => {
  assert.equal(parseServerTimingDuration("db;dur=5", "proxy"), undefined);
});

test("parseServerTimingDuration ignores a malformed duration", () => {
  assert.equal(
    parseServerTimingDuration("proxy;dur=notanumber", "proxy"),
    undefined,
  );
});
