import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "account-info.css"),
  "utf8",
);

test("the profile form stays inside the viewport in RTL and on a phone", () => {
  assert.match(css, /html\[dir="rtl"\] \.account-info-form/);
  assert.match(css, /text-align:\s*start/);
  assert.match(
    css,
    /html\[dir="rtl"\] \.account-info-phone[\s\S]*direction:\s*ltr/,
  );
  assert.match(css, /min-width:\s*0/);
  assert.match(css, /@media \(--phone\)/);
  assert.match(
    css,
    /\.account-info-actions \.account-button,\s*\.account-info-logout \{\s*width:\s*100%/,
  );
  assert.doesNotMatch(css, /max-width:\s*\d+px/);
});
