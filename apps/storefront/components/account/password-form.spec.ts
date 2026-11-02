import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { ApiError } from "@/lib/api";
import {
  initialPasswordState,
  passwordChangeMessage,
  reducePasswordForm,
  type PasswordCopy,
} from "./password-change";

const copy: PasswordCopy = {
  currentRequired: "current-required",
  tooShort: "too-short",
  mismatch: "mismatch",
  reused: "reused",
};

function draft(current: string, next: string, confirm = next) {
  return reducePasswordForm(
    reducePasswordForm(
      reducePasswordForm(initialPasswordState(), {
        type: "edit",
        field: "current",
        value: current,
      }),
      { type: "edit", field: "next", value: next },
    ),
    { type: "edit", field: "confirm", value: confirm },
  );
}

test("a matching new password moves the form into the saving phase", () => {
  const next = reducePasswordForm(draft("current-pass", "new-pass-123"), {
    type: "submit",
    copy,
  });
  assert.equal(next.phase, "saving");
  assert.deepEqual(next.errors, {});
});

test("the wrong confirmation is rejected before a request", () => {
  const next = reducePasswordForm(
    draft("current-pass", "new-pass-123", "other-pass-123"),
    { type: "submit", copy },
  );
  assert.equal(next.phase, "error");
  assert.equal(next.errors.confirm, "mismatch");
});

test("a new password shorter than 8 characters is rejected", () => {
  const next = reducePasswordForm(draft("current-pass", "short"), {
    type: "submit",
    copy,
  });
  assert.equal(next.errors.next, "too-short");
  assert.equal(next.phase, "error");
});

test("reusing the current password is rejected", () => {
  const next = reducePasswordForm(draft("current-pass", "current-pass"), {
    type: "submit",
    copy,
  });
  assert.equal(next.errors.next, "reused");
});

test("an empty current password is rejected", () => {
  const next = reducePasswordForm(draft("", "new-pass-123"), {
    type: "submit",
    copy,
  });
  assert.equal(next.errors.current, "current-required");
});

test("an API failure uses the code, then Persian text, then a fallback", () => {
  const text = (key: string) => key;
  assert.equal(
    passwordChangeMessage(
      new ApiError("رمز عبور فعلی نادرست است.", 401, "password_incorrect"),
      text,
    ),
    "passwordCurrentWrong",
  );
  assert.equal(
    passwordChangeMessage(new ApiError("خطای داخلی سرور", 500), text),
    "خطای داخلی سرور",
  );
  assert.equal(
    passwordChangeMessage(new ApiError("Internal Server Error", 500), text),
    "passwordChangeFailed",
  );
  assert.equal(
    passwordChangeMessage(new ApiError("offline", 0, "network"), text),
    "passwordChangeFailed",
  );
});

test("success clears the fields and failure keeps them for a retry", () => {
  const saving = reducePasswordForm(draft("current-pass", "new-pass-123"), {
    type: "submit",
    copy,
  });
  const saved = reducePasswordForm(saving, { type: "success" });
  assert.equal(saved.phase, "saved");
  assert.equal(saved.draft.current, "");
  assert.equal(saved.draft.next, "");

  const failed = reducePasswordForm(saving, {
    type: "failure",
    message: "network",
  });
  assert.equal(failed.phase, "error");
  assert.equal(failed.message, "network");
  assert.equal(failed.draft.current, "current-pass");
});

test("the password form wires visibility, RTL, and a phone-width layout", () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  const source = readFileSync(join(dir, "password-form.tsx"), "utf8");
  const css = readFileSync(join(dir, "account-info.css"), "utf8");
  assert.match(source, /name="current-password"/);
  assert.match(source, /name="new-password"/);
  assert.match(source, /name="confirm-password"/);
  assert.match(source, /autoComplete="current-password"/);
  assert.match(source, /autoComplete="new-password"/);
  assert.match(source, /aria-pressed=\{shown\}/);
  assert.match(source, /aria-invalid=\{error \? true : undefined\}/);
  assert.match(source, /role="alert"/);
  assert.match(source, /role="status"/);
  assert.match(source, /aria-busy=\{state\.phase === "saving"/);
  assert.match(source, /changeAccountPassword/);
  assert.match(css, /html\[dir="rtl"\] \.account-password-form/);
  assert.match(css, /\.account-password-toggle[\s\S]{0,220}min-height:\s*44px/);
  assert.match(css, /@media \(--phone\)[\s\S]*\.account-password-form/);
  assert.match(css, /direction:\s*ltr/);
});
