import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { passwordChangeError } from "./password-change";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("admin password validation rejects a short, mismatched, or reused password", () => {
  assert.match(
    passwordChangeError({
      currentPassword: "current-pass",
      newPassword: "short",
      confirmPassword: "short",
    }),
    /حداقل ۸/,
  );
  assert.match(
    passwordChangeError({
      currentPassword: "current-pass",
      newPassword: "new-pass-123",
      confirmPassword: "other-pass-12",
    }),
    /یکسان نیست/,
  );
  assert.match(
    passwordChangeError({
      currentPassword: "current-pass",
      newPassword: "current-pass",
      confirmPassword: "current-pass",
    }),
    /متفاوت/,
  );
  assert.equal(
    passwordChangeError({
      currentPassword: "current-pass",
      newPassword: "new-pass-123",
      confirmPassword: "new-pass-123",
    }),
    "",
  );
});

test("the staff password form has visibility, busy, success, and a stacked phone layout", () => {
  const source = readFileSync(
    join(root, "components/admin-dashboard.tsx"),
    "utf8",
  );
  const css = readFileSync(join(root, "app/globals.css"), "utf8");
  const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
  assert.match(layout, /dir="rtl"/);
  assert.match(source, /className="password-toggle"/);
  assert.match(source, /aria-pressed=\{shown\}/);
  assert.match(source, /aria-busy=\{saving \|\| undefined\}/);
  assert.match(source, /role="status"/);
  assert.match(source, /role="alert"/);
  assert.match(source, /name="current-password"/);
  assert.match(source, /name="confirm-password"/);
  assert.match(css, /\.password-toggle[\s\S]{0,280}min-height:\s*44px/);
  assert.match(
    css,
    /@media[\s\S]{0,4000}\.form-grid \{\s*grid-template-columns:\s*1fr/,
  );
});
