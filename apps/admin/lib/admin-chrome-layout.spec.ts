import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "app/globals.css"), "utf8");
const shell = readFileSync(join(root, "components/admin-shell.tsx"), "utf8");

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

test("the notice panel closes from outside, Escape, and the mobile drawer", () => {
  assert.match(shell, /pointerdown/);
  assert.match(shell, /Escape/);
  assert.match(shell, /admin-notice-row/);
  assert.match(shell, /setNoticesOpen\(false\)/);
  assert.match(shell, /setMobileNav\(true\)/);
  assert.doesNotMatch(css, /admin-notice-panel > a \{/);
});

test("password fields use the shared rounded field and a centered toggle", () => {
  assert.match(
    css,
    /\.password-field \{[^}]*border-radius: var\(--radius-md\)/,
  );
  assert.match(
    css,
    /\.password-field > button\.password-toggle \{[^}]*min-height: 44px/,
  );
  assert.match(css, /\.password-field input \{[^}]*font-size: 16px/);
});

test("custom-order tabs keep swipe scrolling without a second scrollbar", () => {
  assert.match(css, /\.commission-tabs \{[^}]*scrollbar-width: none/);
  assert.match(css, /\.commission-tabs::-webkit-scrollbar/);
});
