import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("the PDP add-to-bag button is pill-rounded without touching the shared .button radius", () => {
  const css = readFileSync(new URL("./catalog.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.add-to-bag \.button\.add\s*\{[^}]*border-radius:\s*999px/,
  );
  // The shared site-wide .button radius (2px, in button-link.css) must stay
  // untouched — this file must never define a bare, unscoped `.button` rule.
  assert.equal(/(?:^|[^.\w-])\.button\s*\{/.test(css), false);
});

test("the PDP in-cart 'go to bag' link (add-to-bag-next) is pill-rounded", () => {
  const css = readFileSync(new URL("./catalog.css", import.meta.url), "utf8");
  assert.match(css, /\.add-to-bag-next\s*\{[^}]*border-radius:\s*999px/);
});

test("the inline PDP add-to-bag button (product-summary) is pill-rounded", () => {
  const css = readFileSync(
    new URL(
      "../../../features/product-detail/product-summary.module.css",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(
    css,
    /\.buy :global\(\.button\):global\(\.add\)\s*\{[^}]*border-radius:\s*999px/,
  );
});
