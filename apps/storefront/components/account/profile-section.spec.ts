import assert from "node:assert/strict";
import { test } from "node:test";
import { profileSectionFromPath, sectionAfterPop } from "./profile-section";

test("profile paths open the matching section, and everything else is the collection", () => {
  assert.equal(profileSectionFromPath("/account"), "collection");
  assert.equal(profileSectionFromPath("/orders"), "orders");
  assert.equal(profileSectionFromPath("/orders/RAD-1"), "orders");
  assert.equal(profileSectionFromPath("/account/making"), "making");
  assert.equal(profileSectionFromPath("/making/RAD-M-1"), "making");
  assert.equal(profileSectionFromPath("/favorites"), "favorites");
  assert.equal(
    profileSectionFromPath("/account/notifications"),
    "notifications",
  );
  assert.equal(profileSectionFromPath("/account/addresses"), "addresses");
  assert.equal(profileSectionFromPath("/account/info"), "info");
});

test("back restores a profile section stored beside the current history entry", () => {
  assert.equal(sectionAfterPop({ profileSection: "info" }, "orders"), "info");
  assert.equal(sectionAfterPop({ profileSection: "nope" }, "orders"), "orders");
  assert.equal(sectionAfterPop(null, "collection"), "collection");
});
