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

test("GET /auth/google keeps a generous throttle limit (it's a plain redirect, not a credentialed action)", () => {
  assert.equal(
    Reflect.getMetadata(
      "THROTTLER:LIMITdefault",
      AuthController.prototype.googleStart,
    ),
    20,
  );
});

test("googleStart refuses with a coded 400 when Google OAuth isn't configured", () => {
  const controller = new AuthController(
    {} as never,
    { configured: false } as never,
    {} as never,
    {} as never,
    {} as never,
  );
  assert.throws(
    () =>
      controller.googleStart(undefined, {
        cookie: () => undefined,
        redirect: () => undefined,
      } as never),
    (error: unknown) => {
      const response = (
        error as { getResponse?: () => unknown }
      ).getResponse?.();
      assert.equal(
        (response as { code?: string })?.code,
        "google_not_configured",
      );
      return true;
    },
  );
});
