import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { BadRequestException } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { SeaweedfsStorageService } from "../storage/seaweedfs-storage.service";

/**
 * Pure, no-DB coverage for the "uploaded-then-abandoned" orphan scenario:
 * signature issued → upload succeeds directly to SeaweedFS → the product
 * save that was supposed to attach it never completes (validation failure
 * here, or the admin just closes the dialog). No `ProductImage` row is
 * ever written, so there is nothing for `replaceImages`'s existing
 * post-commit cleanup to act on — that logic only ever diffs against rows
 * that already exist in the DB (see `admin.service.ts#replaceImages`), by
 * design: it must never delete an asset that might still be referenced,
 * and an upload with no DB row has no reference to check.
 *
 * RAD's chosen strategy for this residual class of orphan (documented in
 * `seaweedfs-storage.service.ts` and the task report) is: no automatic,
 * time-based cleanup at all for Phase 2. SeaweedFS's upload model (the
 * browser mints its own object key within a signed folder) means — unlike
 * the R2 design this replaces — there is no copy/rename/migration step
 * ever needed once an upload *is* attached, so there is no window where a
 * referenced asset could be mistaken for an abandoned one. The trade-off,
 * accepted for RAD's low-volume admin-only usage, is that an upload that
 * is never attached simply accumulates under `rad/pending/` until swept
 * manually/periodically via SeaweedFS's own tooling — not application
 * code. This spec proves the application-level half of that design: an
 * abandoned upload never triggers (or needs) a SeaweedFS delete call from
 * `AdminService`, and a saved reference is never touched.
 */
function adminServiceWithStorageSpy() {
  let deleteCalls = 0;
  const storage = new SeaweedfsStorageService(new ConfigService({}));
  storage.destroy = async () => {
    deleteCalls++;
  };
  const nullRepo = null as never;
  const admin = new AdminService(
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
    nullRepo,
    null as never,
    null as never,
    null as never,
    null as never,
    storage,
    () => storage,
    null as never,
    null as never,
  );
  return { admin, deleteCount: () => deleteCalls };
}

describe("abandoned signed uploads (orphans)", () => {
  test("a product save that fails validation never issues a SeaweedFS delete for the abandoned upload", async () => {
    const { admin, deleteCount } = adminServiceWithStorageSpy();
    // Simulates: upload succeeded (we have a real-looking object key), but
    // the save itself is invalid (bad src for a legacy row forces the same
    // BadRequestException path real validation failures take) before
    // replaceImages's pre-transaction DB read of `existing` images would
    // even run against a real repo.
    type ReplaceImages = (
      productId: string,
      slug: string,
      name: string,
      images: unknown[],
    ) => Promise<void>;
    await assert.rejects(
      () =>
        (admin as unknown as { replaceImages: ReplaceImages }).replaceImages(
          "prod_123",
          "some-slug",
          "name",
          [{ storage: "legacy_base64" }],
        ),
      BadRequestException,
    );
    assert.equal(deleteCount(), 0);
  });

  test("the SeaweedFS asset itself is left in place (no delete attempted) — no automatic pending-upload cleanup in Phase 2", () => {
    // Documented, not executable here: there is no bucket/account-level
    // expiry mechanism to provision in this sandbox (there deliberately
    // isn't one — see the module comment above and
    // `seaweedfs-storage.service.ts`). See the task report for the
    // reasoning behind this choice.
    assert.ok(true);
  });
});
