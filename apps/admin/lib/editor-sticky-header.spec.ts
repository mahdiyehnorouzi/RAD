import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../app/globals.css"),
  "utf8",
);

test("the product editor sticky header is opaque and sits above scrolled cards", () => {
  const head = css.slice(
    css.indexOf(".editor-main-head {"),
    css.indexOf(".editor-main-head h2"),
  );
  assert.match(head, /position:\s*sticky/);
  assert.match(head, /top:\s*0/);
  assert.match(head, /z-index:\s*5/);
  assert.match(head, /background(?:-color)?:\s*(var\(--canvas\)|#efe8d9)/);
  assert.doesNotMatch(head, /opacity:\s*0/);
  assert.doesNotMatch(head, /transparent/);
});

test("editor-main does not leave a padding gap above the sticky header for content to bleed through", () => {
  const main = css.slice(
    css.indexOf(".editor-main {"),
    css.indexOf(".editor-main-head {"),
  );
  assert.match(main, /padding:\s*0 /);
  assert.match(main, /overflow-y:\s*auto/);
});
