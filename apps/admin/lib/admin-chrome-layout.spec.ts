import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "app/globals.css"), "utf8");
const products = readFileSync(
  join(root, "features/products/products-workspace.css"),
  "utf8",
);

test("active and inactive navigation rows share one fixed geometry", () => {
  const rule = css.match(/nav\.admin-nav > :is\(a, button\) \{[^}]*\}/)?.[0];
  assert.ok(rule);
  assert.match(rule ?? "", /height: 48px/);
  assert.match(rule ?? "", /line-height: 20px/);
  assert.match(rule ?? "", /padding: 0 14px/);
  const active = css.match(
    /nav\.admin-nav > :is\(a, button\)\.active \{[^}]*\}/,
  )?.[0];
  assert.match(active ?? "", /background: var\(--paper\)/);
  assert.doesNotMatch(active ?? "", /height|padding|font-size|line-height/);
});

test("product cards keep the category on one line and center the row menu on the thumbnail", () => {
  assert.match(products, /\.product-card-category,[\s\S]*?white-space: nowrap/);
  assert.match(
    products,
    /\.product-card-main > \.row-menu-anchor \{[^}]*height: 56px/,
  );
  assert.match(
    products,
    /\.product-card-top \{[^}]*justify-content: space-between/,
  );
  assert.match(
    products,
    /\.product-editor-identity \{[^}]*justify-content: space-between/,
  );
});
