import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("the password toggle is a dedicated end cell, not an overlay on the typed text", () => {
  const css = readFileSync(join(root, "app/globals.css"), "utf8");
  const start = css.indexOf(".password-field {");
  const block = css.slice(start, start + 900);
  assert.ok(start >= 0);
  assert.match(block, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*44px/);
  assert.doesNotMatch(block, /position:\s*absolute/);
  assert.doesNotMatch(block, /padding-inline-end:\s*42px/);
  assert.match(css, /\.password-toggle[\s\S]{0,280}min-height:\s*44px/);
  assert.match(css, /\.password-toggle[\s\S]{0,200}position:\s*static/);
});

test("the login screen is RTL and compact rather than a full-height decorative split", () => {
  const css = readFileSync(join(root, "app/globals.css"), "utf8");
  const source = readFileSync(join(root, "components/admin-login.tsx"), "utf8");
  assert.match(source, /className="login-screen" dir="rtl"/);
  assert.match(source, /aria-pressed=\{showPassword\}/);
  assert.match(source, /autoComplete="current-password"/);
  assert.doesNotMatch(source, /visual-stone/);
  assert.match(css, /\.login-screen[\s\S]{0,120}min-height:\s*100dvh/);
  assert.doesNotMatch(css, /\.login-visual[\s\S]{0,80}min-height:\s*100vh/);
});

test("login still uses the existing workspace login and forgot-password callbacks", () => {
  const source = readFileSync(join(root, "components/admin-login.tsx"), "utf8");
  assert.match(
    source,
    /onLogin\(\{ email: email\.trim\(\), password, rememberMe \}\)/,
  );
  assert.match(source, /onForgotPassword\(email\.trim\(\)\)/);
  assert.doesNotMatch(source, /\/auth\/session/);
  assert.doesNotMatch(source, /fetch\(/);
});
