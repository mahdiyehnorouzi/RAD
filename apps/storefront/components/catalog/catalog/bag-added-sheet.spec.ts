import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(
  new URL("./bag-added-sheet.css", import.meta.url),
  "utf8",
);
const source = readFileSync(
  new URL("./bag-added-sheet.tsx", import.meta.url),
  "utf8",
);

test("the close control sits in its own row, not over the product photo", () => {
  assert.match(source, /bag-added-toolbar/);
  assert.match(css, /\.bag-added-close\s*\{[^}]*position:\s*static/);
  assert.equal(css.includes("order: 2"), false);
  assert.match(css, /\.bag-added-toolbar\s*\{[^}]*min-height:\s*44px/);
});

test("the continue label can wrap and the sheet is tall enough to show it", () => {
  assert.match(css, /\.bag-added-continue\s*\{[^}]*white-space:\s*normal/);
  assert.match(css, /\.bag-added-continue\s*\{[^}]*overflow-wrap:\s*anywhere/);
  assert.match(css, /max-height:\s*min\(92dvh,\s*640px\)/);
  assert.equal(/max-height:[^;]*40dvh/.test(css), false);
  assert.match(css, /env\(safe-area-inset-bottom, 0px\)/);
});
