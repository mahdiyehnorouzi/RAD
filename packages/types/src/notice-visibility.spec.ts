import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isArtistNotice,
  shouldSkipDuplicateNotice,
} from "./index.ts";

test("artist notices are maker and studio messages, not the customer's own actions", () => {
  assert.equal(isArtistNotice("commission_message"), true);
  assert.equal(isArtistNotice("order_confirmed"), true);
  assert.equal(isArtistNotice("order_rejected"), true);
  assert.equal(isArtistNotice("favorite"), false);
  assert.equal(isArtistNotice("cart"), false);
  assert.equal(isArtistNotice("welcome"), false);
  assert.equal(isArtistNotice("order"), false);
});

test("unread studio events collapse, and each artist message is kept", () => {
  assert.equal(shouldSkipDuplicateNotice("commission_quote", true), true);
  assert.equal(shouldSkipDuplicateNotice("commission_quote", false), false);
  assert.equal(shouldSkipDuplicateNotice("commission_message", true), false);
  assert.equal(shouldSkipDuplicateNotice("favorite", true), false);
});
