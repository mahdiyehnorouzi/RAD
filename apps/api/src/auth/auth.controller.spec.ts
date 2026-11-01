import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import { AuthController } from "./auth.controller";

test("PATCH /auth/password keeps the existing limit of 8 requests per minute", () => {
  const handler = AuthController.prototype.changePassword;
  assert.equal(Reflect.getMetadata("THROTTLER:LIMITdefault", handler), 8);
  assert.equal(Reflect.getMetadata("THROTTLER:TTLdefault", handler), 60_000);
});

test("password reset stays on its own existing limits", () => {
  assert.equal(
    Reflect.getMetadata(
      "THROTTLER:LIMITdefault",
      AuthController.prototype.forgotPassword,
    ),
    5,
  );
  assert.equal(
    Reflect.getMetadata(
      "THROTTLER:LIMITdefault",
      AuthController.prototype.resetPassword,
    ),
    8,
  );
});
