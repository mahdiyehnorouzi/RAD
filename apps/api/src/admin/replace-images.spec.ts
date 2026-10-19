import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../database/data-source";
import { isLocalDatabaseUrl } from "../database/safe-target";
import {
  CartItem,
  Favorite,
  Order,
  PaymentIntent,
  Product,
  ProductImage,
  Review,
  User,
  Vendor,
} from "../database/entities";
import { AdminService } from "./admin.service";
import { PaymentReviewService } from "../orders/payment-review.service";
import { InventoryService } from "../inventory/inventory.service";
import { NoticesService } from "../notices/notices.service";
import { MailService } from "../mail/mail.service";
import { CloudinaryStorageService } from "../storage/cloudinary-storage.service";
import { S3StorageService } from "../storage/s3-storage.service";
import {
  UPLOAD_INTENT_MAX_AGE_MS,
  __resetIssuedS3UploadsForTests,
  recordIssuedS3Upload,
} from "../storage/s3-upload-intent";

/**
 * DB-backed coverage for `AdminService.saveProduct`/`replaceImages` (Phase
 * 2: direct-to-Cloudinary admin image uploads). Requires embedded-postgres,
 * which needs to spin up a real Postgres server — this sandbox's
 * Docker/root restrictions block that (same limitation noted for the
 * existing `catalog-image-select.spec.ts`), so this file is not expected
 * to pass in this environment. It is written to run as-is anywhere
 * embedded-postgres can start.
 */
function freePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

let dataSource: DataSource;
let pg: EmbeddedPostgres;
let databaseDir: string;
let admin: AdminService;
let adminS3Active: AdminService;
let deleteCalls: string[];
let s3Storage: S3StorageService;
let s3DeleteCalls: string[];

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-admin-images-"));
  const port = await freePort();
  pg = new EmbeddedPostgres({
    databaseDir,
    user: "rad",
    password: "rad",
    port,
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("rad_test");

  const testDatabaseUrl = `postgresql://rad:rad@127.0.0.1:${port}/rad_test`;
  // Defense-in-depth: this spec always builds its own ephemeral,
  // localhost-only Postgres and never reads process.env.DATABASE_URL —
  // this assertion just makes that invariant explicit and catches any
  // future edit that accidentally wires in a real connection string.
  if (!isLocalDatabaseUrl(testDatabaseUrl)) {
    throw new Error(
      "Refusing to run DB-backed tests against a non-local database.",
    );
  }
  dataSource = createAppDataSource({
    url: testDatabaseUrl,
    synchronize: true,
  } as never);
  await dataSource.initialize();

  const repo = dataSource.getRepository.bind(dataSource);
  const inventory = new InventoryService(dataSource);
  const notices = {
    notifyPaymentVerified: async () => {},
    notifyPaymentRejected: async () => {},
  } as unknown as NoticesService;
  const mail = new MailService(new ConfigService({}));
  const paymentReview = new PaymentReviewService(
    dataSource,
    inventory,
    notices,
    mail,
  );
  const storage = new CloudinaryStorageService(new ConfigService({}));
  // This sandbox has no real Cloudinary credentials, and these specs never
  // actually upload bytes to Cloudinary — only `objectKey` (public_id)
  // strings are exercised. Stub the one Cloudinary call `replaceImages`
  // makes (delete of an orphaned/removed asset) so the DB-level logic can
  // be asserted without a live Cloudinary connection; it resolves
  // successfully by default.
  storage.verifyMedia = async (objectKey, kind) => ({
    objectKey,
    storage: kind === "video" ? "cloudinary_video" : "cloudinary",
  });
  deleteCalls = [];
  storage.destroy = async (publicId: string) => {
    deleteCalls.push(publicId);
  };
  // Same stub pattern for the S3 provider, used by the mixed-provider
  // tests below — no real SeaweedFS connection, only objectKey strings.
  s3Storage = new S3StorageService(new ConfigService({}));
  s3Storage.verifyMedia = async (objectKey, kind) => ({
    objectKey,
    storage: kind === "video" ? "s3_video" : "s3",
  });
  s3DeleteCalls = [];
  s3Storage.destroy = async (objectKey: string) => {
    s3DeleteCalls.push(objectKey);
  };
  admin = new AdminService(
    dataSource,
    repo(Product),
    repo(ProductImage),
    repo(Order),
    repo(User),
    repo(Vendor),
    repo(CartItem),
    repo(Favorite),
    repo(Review),
    repo(PaymentIntent),
    inventory,
    paymentReview,
    storage,
    storage,
    s3Storage,
  );
  // A second instance, differing ONLY in which provider is "active"
  // (s3Storage instead of storage/cloudinary) — needed to exercise
  // verifyProductMedia's S3 branch (isS3Active()) through the real
  // service, not just unit-test checkIssuedS3Upload in isolation.
  adminS3Active = new AdminService(
    dataSource,
    repo(Product),
    repo(ProductImage),
    repo(Order),
    repo(User),
    repo(Vendor),
    repo(CartItem),
    repo(Favorite),
    repo(Review),
    repo(PaymentIntent),
    inventory,
    paymentReview,
    s3Storage,
    storage,
    s3Storage,
  );
});

after(async () => {
  await dataSource?.destroy();
  await pg?.stop();
  if (databaseDir) rmSync(databaseDir, { recursive: true, force: true });
});

function baseInput(slug: string, images: unknown) {
  return {
    slug,
    name: "اثر آزمایشی",
    description: "توضیحات",
    category: "گلدان",
    price: 1_000_000,
    status: "available" as const,
    artist: "استودیو رَد",
    images,
  };
}

describe("AdminService.saveProduct — cloudinary images (Phase 2)", () => {
  test("persists a new cloudinary image uploaded pre-creation (rad/pending/ public_id) as-is — no migration step", async () => {
    const slug = `cloudinary-new-${Date.now()}`;
    // Simulates the real flow: the admin dialog signs before the product
    // exists, so the public_id comes back under rad/pending/, not
    // rad/products/<id>/ — see signProductImageUpload's productId=null
    // branch. Unlike the old R2 design, this public_id is never migrated —
    // it is persisted exactly as the client sends it (after namespace
    // validation), forever.
    const objectKey = `rad/pending/abc111DEF`;
    const saved = await admin.saveProduct(
      baseInput(slug, [{ storage: "cloudinary", objectKey }]) as never,
    );
    assert.equal(saved.images.length, 1);
    const row = await dataSource
      .getRepository(ProductImage)
      .findOneOrFail({ where: { productSlug: slug } });
    assert.equal(row.storage, "cloudinary");
    assert.equal(row.objectKey, objectKey);
    assert.equal(row.src, null);
    assert.deepEqual(deleteCalls, []);
  });

  test("persists a new cloudinary image keyed by the product's id (post-creation edit upload)", async () => {
    const slug = `cloudinary-byid-${Date.now()}`;
    const created = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const objectKey = `rad/products/${created.id}/xyz222ABC`;
    const saved = await admin.saveProduct(
      baseInput(slug, [{ storage: "cloudinary", objectKey }]) as never,
      created.id,
    );
    assert.equal(saved.images.length, 1);
    const row = await dataSource
      .getRepository(ProductImage)
      .findOneOrFail({ where: { productSlug: slug } });
    assert.equal(row.objectKey, objectKey);
  });

  test("rejects a client-supplied cloudinary objectKey that doesn't match the expected id-namespaced pattern", async () => {
    const slug = `cloudinary-bad-key-${Date.now()}`;
    await assert.rejects(() =>
      admin.saveProduct(
        baseInput(slug, [
          {
            storage: "cloudinary",
            objectKey: "rad/products/someone-elses-product-id/x",
          },
        ]) as never,
      ),
    );
  });

  test("rejects a forged objectKey that reuses another product's real id", async () => {
    const slugA = `cloudinary-forge-a-${Date.now()}`;
    const productA = await admin.saveProduct(
      baseInput(slugA, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const slugB = `cloudinary-forge-b-${Date.now()}`;
    // An admin crafts a key that *looks* legitimate (correct pattern) but
    // targets product A's namespace while saving product B — must still
    // be rejected because the validation is against *this* product's id.
    const forgedKey = `rad/products/${productA.id}/forged333`;
    await assert.rejects(() =>
      admin.saveProduct(
        baseInput(slugB, [
          { storage: "cloudinary", objectKey: forgedKey },
        ]) as never,
      ),
    );
  });

  test("slug rename regression: current code forbids changing slug after creation", async () => {
    const slug = `cloudinary-rename-${Date.now()}`;
    const baseline = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    await assert.rejects(
      () =>
        admin.saveProduct(
          baseInput(`${slug}-renamed`, [
            { storage: "static", src: "/catalog/test.jpg" },
          ]) as never,
          baseline.id,
        ),
      /شناسه URL پس از ایجاد قابل تغییر نیست/,
    );
  });

  test("duplicate/repeated save with the same cloudinary image payload is idempotent (no duplicate rows, no delete calls)", async () => {
    const slug = `cloudinary-dup-${Date.now()}`;
    const created = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const objectKey = `rad/products/${created.id}/dup444`;
    const input = baseInput(slug, [{ storage: "cloudinary", objectKey }]);
    await admin.saveProduct(input as never, created.id);
    deleteCalls.length = 0;
    const second = await admin.saveProduct(input as never, created.id);
    assert.equal(second.images.length, 1);
    const rows = await dataSource
      .getRepository(ProductImage)
      .find({ where: { productSlug: slug } });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].objectKey, objectKey);
    assert.deepEqual(
      deleteCalls,
      [],
      "re-saving an unchanged image set must not delete anything",
    );
  });

  test("removing one cloudinary image from a multi-image product deletes only the removed asset, post-commit", async () => {
    const slug = `cloudinary-partial-remove-${Date.now()}`;
    const created = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const keyA = `rad/products/${created.id}/keep555`;
    const keyB = `rad/products/${created.id}/drop666`;
    await admin.saveProduct(
      baseInput(slug, [
        { storage: "cloudinary", objectKey: keyA },
        { storage: "cloudinary", objectKey: keyB },
      ]) as never,
      created.id,
    );
    deleteCalls.length = 0;
    const after = await admin.saveProduct(
      baseInput(slug, [{ storage: "cloudinary", objectKey: keyA }]) as never,
      created.id,
    );
    assert.equal(after.images.length, 1);
    const rows = await dataSource
      .getRepository(ProductImage)
      .find({ where: { productSlug: slug } });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].objectKey, keyA);
    assert.deepEqual(deleteCalls, [keyB]);
  });

  test("editing a product without touching images leaves its image rows byte-for-byte unchanged, and deletes nothing", async () => {
    const slug = `cloudinary-no-image-change-${Date.now()}`;
    const created = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const key = `rad/products/${created.id}/stable777`;
    await admin.saveProduct(
      baseInput(slug, [{ storage: "cloudinary", objectKey: key }]) as never,
      created.id,
    );
    const before = await dataSource
      .getRepository(ProductImage)
      .find({ where: { productSlug: slug } });
    deleteCalls.length = 0;
    const input = {
      ...baseInput(slug, [{ storage: "cloudinary", objectKey: key }]),
      price: 2_000_000,
    };
    await admin.saveProduct(input as never, created.id);
    const after = await dataSource
      .getRepository(ProductImage)
      .find({ where: { productSlug: slug } });
    assert.equal(after.length, before.length);
    assert.equal(after[0].objectKey, before[0].objectKey);
    assert.deepEqual(deleteCalls, []);
  });

  test("mixed array of legacy_base64 and cloudinary images preserves order", async () => {
    const slug = `cloudinary-mixed-${Date.now()}`;
    const created = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const objectKey = `rad/products/${created.id}/mixed888`;
    const base64 = `data:image/png;base64,${Buffer.from("x").toString("base64")}`;
    const saved = await admin.saveProduct(
      baseInput(slug, [
        { storage: "legacy_base64", src: base64 },
        { storage: "cloudinary", objectKey },
      ]) as never,
      created.id,
    );
    const rows = await dataSource
      .getRepository(ProductImage)
      .find({ where: { productSlug: slug }, order: { sortOrder: "ASC" } });
    assert.equal(rows.length, 2);
    assert.equal(rows[0].storage, "legacy_base64");
    assert.equal(rows[0].sortOrder, 0);
    assert.equal(rows[1].storage, "cloudinary");
    assert.equal(rows[1].objectKey, objectKey);
    assert.equal(rows[1].sortOrder, 1);
    assert.equal(saved.images.length, 2);
  });

  test("a failed Cloudinary delete during cleanup is logged/non-fatal — the save itself still succeeds", async () => {
    const slug = `cloudinary-delete-fails-${Date.now()}`;
    const created = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const keyA = `rad/products/${created.id}/flaky999`;
    await admin.saveProduct(
      baseInput(slug, [{ storage: "cloudinary", objectKey: keyA }]) as never,
      created.id,
    );
    const storage = admin["storage"] as CloudinaryStorageService;
    const originalDestroy = storage.destroy;
    storage.destroy = async () => {
      throw new Error("simulated Cloudinary outage");
    };
    try {
      const after = await admin.saveProduct(
        baseInput(slug, [
          { storage: "static", src: "/catalog/test.jpg" },
        ]) as never,
        created.id,
      );
      assert.equal(after.images.length, 1);
    } finally {
      storage.destroy = originalDestroy;
    }
    const rows = await dataSource
      .getRepository(ProductImage)
      .find({ where: { productSlug: slug } });
    assert.equal(
      rows.length,
      1,
      "the DB-side replacement must still have committed despite the failed Cloudinary delete",
    );
    assert.equal(rows[0].storage, "static");
  });
});

describe("AdminService.saveProduct — s3 images (PR 4 + security review)", () => {
  test("persists a new s3 image uploaded pre-creation (rad/pending/ key) as-is, given a matching upload intent", async () => {
    __resetIssuedS3UploadsForTests();
    const slug = `s3-new-${Date.now()}`;
    const objectKey = `rad/pending/${"a".repeat(32)}`;
    recordIssuedS3Upload(objectKey, null, "image");
    const saved = await admin.saveProduct(
      baseInput(slug, [{ storage: "s3", objectKey }]) as never,
    );
    assert.equal(saved.images.length, 1);
    const row = await dataSource
      .getRepository(ProductImage)
      .findOneOrFail({ where: { productSlug: slug } });
    assert.equal(row.storage, "s3");
    assert.equal(row.objectKey, objectKey);
    assert.equal(row.src, null);
    assert.deepEqual(s3DeleteCalls, []);
  });

  test("MISSING INTENT: a brand-new s3 key with no existing row and no upload intent is rejected (fail-closed, never accepted on namespace shape alone)", async () => {
    __resetIssuedS3UploadsForTests();
    const slug = `s3-missing-intent-${Date.now()}`;
    const objectKey = `rad/pending/${"m".repeat(32)}`;
    await assert.rejects(() =>
      admin.saveProduct(
        baseInput(slug, [{ storage: "s3", objectKey }]) as never,
      ),
    );
    const row = await dataSource
      .getRepository(ProductImage)
      .findOne({ where: { objectKey } });
    assert.equal(row, null, "no row must ever be persisted for an unauthorized key");
  });

  test("EXPIRED INTENT: a key signed long enough ago that its intent has expired is rejected exactly like a missing one", async () => {
    __resetIssuedS3UploadsForTests();
    const slug = `s3-expired-intent-${Date.now()}`;
    const objectKey = `rad/pending/${"n".repeat(32)}`;
    const longAgo = Date.now() - UPLOAD_INTENT_MAX_AGE_MS - 60_000;
    recordIssuedS3Upload(objectKey, null, "image", longAgo);
    await assert.rejects(() =>
      admin.saveProduct(
        baseInput(slug, [{ storage: "s3", objectKey }]) as never,
      ),
    );
  });

  test("API RESTART: an intent recorded, then the process restarting (simulated by clearing the tracker) before the save ever happens, is rejected — never silently falls back to accepting the key on namespace shape", async () => {
    const slug = `s3-restart-${Date.now()}`;
    const objectKey = `rad/pending/${"o".repeat(32)}`;
    recordIssuedS3Upload(objectKey, null, "image"); // "sign" happens...
    __resetIssuedS3UploadsForTests(); // ...then the process restarts before "save"
    await assert.rejects(() =>
      admin.saveProduct(
        baseInput(slug, [{ storage: "s3", objectKey }]) as never,
      ),
    );
  });

  test("INTENT BELONGING TO ANOTHER PRODUCT: a key minted for product A's real id is rejected when claimed for product B, even with an intent record present", async () => {
    __resetIssuedS3UploadsForTests();
    const slugA = `s3-intent-other-a-${Date.now()}`;
    const productA = await admin.saveProduct(
      baseInput(slugA, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const slugB = `s3-intent-other-b-${Date.now()}`;
    const productB = await admin.saveProduct(
      baseInput(slugB, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    // A pending-style key (passes namespace shape for anyone) but the
    // recorded intent explicitly names product A, not B.
    const objectKey = `rad/pending/${"p".repeat(32)}`;
    recordIssuedS3Upload(objectKey, productA.id, "image");
    // existingId must be productB's real id — slugB already exists, so
    // omitting it would reject on a slug conflict before ever reaching
    // the S3 ownership check this test means to exercise.
    await assert.rejects(() =>
      admin.saveProduct(
        baseInput(slugB, [{ storage: "s3", objectKey }]) as never,
        productB.id,
      ),
    );
  });

  test("WRONG MEDIA KIND: an intent recorded for a video is rejected when the same key is claimed as an image", async () => {
    __resetIssuedS3UploadsForTests();
    const slug = `s3-wrong-kind-${Date.now()}`;
    const objectKey = `rad/pending/${"q".repeat(32)}`;
    recordIssuedS3Upload(objectKey, null, "video");
    await assert.rejects(() =>
      admin.saveProduct(
        baseInput(slug, [
          { storage: "static", src: "/catalog/test.jpg" },
          { storage: "s3", objectKey },
        ]) as never,
      ),
    );
  });

  test("REPEATED VERIFICATION: verifying the same freshly-signed s3 upload twice (e.g. a retried request) succeeds identically both times", async () => {
    __resetIssuedS3UploadsForTests();
    const slug = `s3-repeat-verify-${Date.now()}`;
    const objectKey = `rad/pending/${"r".repeat(32)}`;
    recordIssuedS3Upload(objectKey, null, "image");
    const first = await adminS3Active.verifyProductMedia(slug, objectKey, "image");
    const second = await adminS3Active.verifyProductMedia(slug, objectKey, "image");
    assert.deepEqual(first, second);
    assert.equal(first.storage, "s3");
  });

  test("RE-EDITING AN EXISTING VERIFIED S3 IMAGE: after the original upload intent is gone (expired/restarted), a product's already-attached s3 image survives an unrelated edit untouched", async () => {
    __resetIssuedS3UploadsForTests();
    const slug = `s3-reedit-${Date.now()}`;
    const objectKey = `rad/pending/${"s".repeat(32)}`;
    recordIssuedS3Upload(objectKey, null, "image");
    const created = await admin.saveProduct(
      baseInput(slug, [{ storage: "s3", objectKey }]) as never,
    );
    // The original intent is now gone — simulates a restart, or simply
    // the TTL having elapsed since the first save.
    __resetIssuedS3UploadsForTests();
    const edited = await admin.saveProduct(
      { ...baseInput(slug, [{ storage: "s3", objectKey }]), price: 9_999_999 } as never,
      created.id,
    );
    assert.equal(edited.images.length, 1);
    const row = await dataSource
      .getRepository(ProductImage)
      .findOneOrFail({ where: { productSlug: slug } });
    assert.equal(row.objectKey, objectKey);
    assert.deepEqual(s3DeleteCalls, []);
  });

  test("ATTACHING AN UNRELATED EXISTING S3 OBJECT: a key already durably attached to product A can never be claimed by product B, with or without an intent record", async () => {
    __resetIssuedS3UploadsForTests();
    const slugA = `s3-unrelated-a-${Date.now()}`;
    const objectKey = `rad/pending/${"t".repeat(32)}`;
    recordIssuedS3Upload(objectKey, null, "image");
    await admin.saveProduct(
      baseInput(slugA, [{ storage: "s3", objectKey }]) as never,
    );
    const slugB = `s3-unrelated-b-${Date.now()}`;
    const productB = await admin.saveProduct(
      baseInput(slugB, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    // No fresh intent recorded for B — if this were somehow accepted, it
    // could only be via the namespace check alone, which this proves is
    // never sufficient.
    await assert.rejects(() =>
      admin.saveProduct(
        baseInput(slugB, [{ storage: "s3", objectKey }]) as never,
        productB.id,
      ),
    );
    const row = await dataSource
      .getRepository(ProductImage)
      .findOneOrFail({ where: { objectKey } });
    assert.equal(
      row.productSlug,
      slugA,
      "the object must remain attached to its original product",
    );
  });

  test("rejects a client-supplied s3 objectKey with a forged/short token", async () => {
    const slug = `s3-bad-token-${Date.now()}`;
    await assert.rejects(() =>
      admin.saveProduct(
        baseInput(slug, [
          { storage: "s3", objectKey: "rad/pending/short" },
        ]) as never,
      ),
    );
  });

  test("rejects a forged s3 objectKey that reuses another product's real id (cross-product claiming)", async () => {
    const slugA = `s3-forge-a-${Date.now()}`;
    const productA = await admin.saveProduct(
      baseInput(slugA, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const slugB = `s3-forge-b-${Date.now()}`;
    const forgedKey = `rad/products/${productA.id}/${"b".repeat(32)}`;
    await assert.rejects(() =>
      admin.saveProduct(
        baseInput(slugB, [{ storage: "s3", objectKey: forgedKey }]) as never,
      ),
    );
  });

  test("ownership intent: a pending key this process minted as a VIDEO is still accepted once correctly attached as a video", async () => {
    __resetIssuedS3UploadsForTests();
    const slug = `s3-intent-ok-${Date.now()}`;
    const objectKey = `rad/pending/${"i".repeat(32)}`;
    // Simulates signProductImageUpload having minted this key for a
    // pending (pre-creation) upload, recorded via the real tracker.
    recordIssuedS3Upload(objectKey, null, "video");
    const saved = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
        { storage: "s3_video", objectKey },
      ]) as never,
    );
    assert.equal(saved.images.length, 1); // s3_video is excluded from the public images count
    const rows = await dataSource
      .getRepository(ProductImage)
      .find({ where: { productSlug: slug } });
    assert.equal(rows.length, 2);
    assert.ok(rows.some((row) => row.storage === "s3_video" && row.objectKey === objectKey));
  });

  test("idempotent retry: re-saving the same s3 payload twice does not duplicate rows or delete anything — and the retry needs no intent at all (durable DB row is the proof)", async () => {
    __resetIssuedS3UploadsForTests();
    const slug = `s3-dup-${Date.now()}`;
    const created = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const objectKey = `rad/products/${created.id}/${"c".repeat(32)}`;
    recordIssuedS3Upload(objectKey, created.id, "image");
    const input = baseInput(slug, [{ storage: "s3", objectKey }]);
    await admin.saveProduct(input as never, created.id);
    s3DeleteCalls.length = 0;
    __resetIssuedS3UploadsForTests(); // the retry must not need the original intent
    const second = await admin.saveProduct(input as never, created.id);
    assert.equal(second.images.length, 1);
    const rows = await dataSource
      .getRepository(ProductImage)
      .find({ where: { productSlug: slug } });
    assert.equal(rows.length, 1);
    assert.deepEqual(s3DeleteCalls, []);
  });

  test("removing one s3 image from a multi-image product deletes only the removed asset, through S3StorageService specifically", async () => {
    const slug = `s3-partial-remove-${Date.now()}`;
    const created = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const keyA = `rad/products/${created.id}/${"d".repeat(32)}`;
    const keyB = `rad/products/${created.id}/${"e".repeat(32)}`;
    recordIssuedS3Upload(keyA, created.id, "image");
    recordIssuedS3Upload(keyB, created.id, "image");
    await admin.saveProduct(
      baseInput(slug, [
        { storage: "s3", objectKey: keyA },
        { storage: "s3", objectKey: keyB },
      ]) as never,
      created.id,
    );
    s3DeleteCalls.length = 0;
    deleteCalls.length = 0;
    __resetIssuedS3UploadsForTests(); // editing an already-attached set needs no intent
    const after = await admin.saveProduct(
      baseInput(slug, [{ storage: "s3", objectKey: keyA }]) as never,
      created.id,
    );
    assert.equal(after.images.length, 1);
    assert.deepEqual(s3DeleteCalls, [keyB]);
    assert.deepEqual(
      deleteCalls,
      [],
      "an s3 object's deletion must never go through CloudinaryStorageService",
    );
  });

  test("a failed S3 delete during cleanup is logged/non-fatal — the save itself still succeeds", async () => {
    __resetIssuedS3UploadsForTests();
    const slug = `s3-delete-fails-${Date.now()}`;
    const created = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const keyA = `rad/products/${created.id}/${"f".repeat(32)}`;
    recordIssuedS3Upload(keyA, created.id, "image");
    await admin.saveProduct(
      baseInput(slug, [{ storage: "s3", objectKey: keyA }]) as never,
      created.id,
    );
    const originalDestroy = s3Storage.destroy;
    s3Storage.destroy = async () => {
      throw new Error("simulated S3 outage");
    };
    try {
      const after = await admin.saveProduct(
        baseInput(slug, [
          { storage: "static", src: "/catalog/test.jpg" },
        ]) as never,
        created.id,
      );
      assert.equal(after.images.length, 1);
    } finally {
      s3Storage.destroy = originalDestroy;
    }
    const rows = await dataSource
      .getRepository(ProductImage)
      .find({ where: { productSlug: slug } });
    assert.equal(
      rows.length,
      1,
      "the DB-side replacement must still have committed despite the failed S3 delete",
    );
    assert.equal(rows[0].storage, "static");
  });

  test("mixed cloudinary + s3 images on the same product: each is verified and later deleted through its OWN recorded provider", async () => {
    __resetIssuedS3UploadsForTests();
    const slug = `mixed-providers-${Date.now()}`;
    const created = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const cloudinaryKey = `rad/products/${created.id}/${"g".repeat(10)}`;
    const s3Key = `rad/products/${created.id}/${"h".repeat(32)}`;
    recordIssuedS3Upload(s3Key, created.id, "image");
    const saved = await admin.saveProduct(
      baseInput(slug, [
        { storage: "cloudinary", objectKey: cloudinaryKey },
        { storage: "s3", objectKey: s3Key },
      ]) as never,
      created.id,
    );
    assert.equal(saved.images.length, 2);
    const rows = await dataSource
      .getRepository(ProductImage)
      .find({ where: { productSlug: slug }, order: { sortOrder: "ASC" } });
    assert.equal(rows[0].storage, "cloudinary");
    assert.equal(rows[1].storage, "s3");

    deleteCalls.length = 0;
    s3DeleteCalls.length = 0;
    // Drop both — each must be deleted through its OWN provider.
    const after = await admin.saveProduct(
      baseInput(slug, [{ storage: "static", src: "/catalog/test.jpg" }]) as never,
      created.id,
    );
    assert.equal(after.images.length, 1);
    assert.deepEqual(deleteCalls, [cloudinaryKey]);
    assert.deepEqual(s3DeleteCalls, [s3Key]);
  });

  test("rejects a mismatched storage/kind pairing: a key minted for a VIDEO upload is rejected when claimed as an image, even though the namespace check alone would have passed it", async () => {
    __resetIssuedS3UploadsForTests();
    const slug = `s3-kind-mismatch-${Date.now()}`;
    const objectKey = `rad/pending/${"j".repeat(32)}`;
    recordIssuedS3Upload(objectKey, null, "video");
    // Claimed here as a plain image ("s3", not "s3_video") — namespace
    // validation (isValidS3ObjectKey) has no concept of "kind" at all and
    // would pass this; only the upload-intent check catches the mismatch.
    await assert.rejects(() =>
      admin.saveProduct(
        baseInput(slug, [
          { storage: "static", src: "/catalog/test.jpg" },
          { storage: "s3", objectKey },
        ]) as never,
      ),
    );
  });
});
