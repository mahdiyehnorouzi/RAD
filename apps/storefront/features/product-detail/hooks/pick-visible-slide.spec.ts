import { test } from "node:test";
import assert from "node:assert/strict";
import { pickVisibleSlide } from "./pick-visible-slide";

test("at rest, the one fully-visible slide wins", () => {
  assert.equal(
    pickVisibleSlide([
      { index: 0, isIntersecting: false, intersectionRatio: 0 },
      { index: 1, isIntersecting: true, intersectionRatio: 1 },
      { index: 2, isIntersecting: false, intersectionRatio: 0 },
    ]),
    1,
  );
});

test("mid-scroll, the entry with the greater intersection ratio wins", () => {
  assert.equal(
    pickVisibleSlide([
      { index: 0, isIntersecting: true, intersectionRatio: 0.35 },
      { index: 1, isIntersecting: true, intersectionRatio: 0.65 },
    ]),
    1,
  );
});

test("an entry below the observer's threshold (isIntersecting false) never wins, even with a nonzero ratio", () => {
  assert.equal(
    pickVisibleSlide([
      { index: 0, isIntersecting: false, intersectionRatio: 0.4 },
      { index: 1, isIntersecting: true, intersectionRatio: 0.4 },
    ]),
    1,
  );
});

test("no intersecting entries this batch returns null (caller keeps the previous active slide)", () => {
  assert.equal(
    pickVisibleSlide([
      { index: 0, isIntersecting: false, intersectionRatio: 0 },
      { index: 1, isIntersecting: false, intersectionRatio: 0 },
    ]),
    null,
  );
  assert.equal(pickVisibleSlide([]), null);
});
