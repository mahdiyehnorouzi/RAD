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

test("the close control keeps its 44x44 hit area, has no stray border, and stays keyboard-focusable", () => {
  assert.match(css, /\.bag-added-close\s*\{[^}]*width:\s*44px/);
  assert.match(css, /\.bag-added-close\s*\{[^}]*height:\s*44px/);
  assert.equal(/\.bag-added-close\s*\{[^}]*border-bottom/.test(css), false);
  assert.match(
    css,
    /\.bag-added-close:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--focus\)/,
  );
  assert.match(
    css,
    /\.bag-added-close:focus-visible\s*\{[^}]*box-shadow:\s*none/,
  );
});

test("the continue label can wrap and the sheet keeps a top and bottom inset", () => {
  assert.match(css, /\.bag-added-continue\s*\{[^}]*white-space:\s*normal/);
  assert.match(css, /\.bag-added-continue\s*\{[^}]*overflow-wrap:\s*anywhere/);
  assert.match(css, /env\(safe-area-inset-top, 0px\)/);
  assert.equal(/max-height:[^;]*40dvh/.test(css), false);
  assert.equal(/max-height:[^;]*92dvh/.test(css), false);
  assert.match(css, /env\(safe-area-inset-bottom, 0px\)/);
});

test("the photo sits on the left and the primary action follows the site button", () => {
  assert.match(css, /\.bag-added-product\s*\{[^}]*direction:\s*ltr/);
  assert.match(css, /\.bag-added-primary\s*\{[^}]*background:\s*var\(--moss\)/);
  assert.match(css, /\.bag-added-primary\s*\{[^}]*border-radius:\s*999px/);
  assert.match(source, /className="button bag-added-primary"/);
  assert.match(source, /locale === "fa" \? ArrowLeft : ArrowRight/);
  assert.equal(css.includes("#173d31"), false);
});
