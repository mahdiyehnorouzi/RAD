import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { canAdmin } from "./permissions";
import { CloudinaryStorageService } from "../storage/cloudinary-storage.service";

/**
 * Pure, no-DB coverage for the sign-upload endpoint's auth/validation
 * layer:
 * - `product.write` permission gating (same `assert` every other admin
 *   write endpoint uses, enforced ahead of `AdminController`'s AdminGuard).
 * - mime allowlist rejection, which runs before anything
 *   Cloudinary/DB-related, so it needs no real Cloudinary credentials or
 *   embedded-postgres.
 *
 * `AdminService` is instantiated with `null` repositories: none of the
 * methods under test touch them.
 */
function adminServiceForUnitTests() {
  const nullRepo = null as never;
  return new AdminService(
    null as never,
    nullRepo,
    nullRepo,
    nullRepo,
    nullRepo,
    nullRepo,
    nullRepo,
    nullRepo,
    nullRepo,
    nullRepo,
    null as never,
    null as never,
    new CloudinaryStorageService(new ConfigService({})),
  );
}

describe("admin sign-upload endpoint authorization", () => {
  test("viewer role lacks product.write (unauthorized)", () => {
    assert.equal(canAdmin("viewer", "product.write"), false);
  });

  test("editor/manager/owner roles have product.write (same gate as other product writes)", () => {
    assert.equal(canAdmin("editor", "product.write"), true);
    assert.equal(canAdmin("manager", "product.write"), true);
    assert.equal(canAdmin("owner", "product.write"), true);
  });

  test("undefined/unknown role is rejected (unauthenticated-shaped request)", () => {
    assert.equal(canAdmin(undefined, "product.write"), false);
    assert.equal(canAdmin("not-a-role", "product.write"), false);
  });

  test("AdminService.assert throws ForbiddenException for a role without product.write", () => {
    const admin = adminServiceForUnitTests();
    assert.throws(() => admin.assert("viewer", "product.write"), ForbiddenException);
    assert.throws(() => admin.assert(undefined, "product.write"), ForbiddenException);
  });
});

describe("admin sign-upload endpoint mime validation", () => {
  test("rejects a disallowed mime type before ever touching Cloudinary", async () => {
    const admin = adminServiceForUnitTests();
    await assert.rejects(
      () => admin.signProductImageUpload("moon-vase", "application/pdf"),
      BadRequestException,
    );
    await assert.rejects(
      () => admin.signProductImageUpload("moon-vase", "image/gif"),
      BadRequestException,
    );
  });
});
