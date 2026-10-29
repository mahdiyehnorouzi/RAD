import { test } from "node:test";
import assert from "node:assert/strict";
import { isHeroSlide } from "./is-hero-slide";

test("the first slide in the main stage is the hero", () => {
  assert.equal(isHeroSlide("stage", true), true);
});

test("the first slide in the thumbnail rail is not the hero", () => {
  assert.equal(isHeroSlide("thumb", true), false);
});

test("a non-first slide in the main stage is not the hero, even mid-browse", () => {
  assert.equal(isHeroSlide("stage", false), false);
});

test("a non-first slide in the thumbnail rail is not the hero", () => {
  assert.equal(isHeroSlide("thumb", false), false);
});
