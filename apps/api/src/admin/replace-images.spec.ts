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
let deleteCalls: string[];

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

  dataSource = createAppDataSource({
    url: `postgresql://rad:rad@127.0.0.1:${port}/rad_test`,
    synchronize: true,
  } as never);
  await dataSource.initialize();

  const repo = dataSource.getRepository.bind(dataSource);
  const inventory = new InventoryService(dataSource);
  const notices = { notifyPaymentVerified: async () => {}, notifyPaymentRejected: async () => {} } as unknown as NoticesService;
  const mail = new MailService(new ConfigService({}));
  const paymentReview = new PaymentReviewService(dataSource, inventory, notices, mail);
  const storage = new CloudinaryStorageService(new ConfigService({}));
  // This sandbox has no real Cloudinary credentials, and these specs never
  // actually upload bytes to Cloudinary — only `objectKey` (public_id)
  // strings are exercised. Stub the one Cloudinary call `replaceImages`
  // makes (delete of an orphaned/removed asset) so the DB-level logic can
  // be asserted without a live Cloudinary connection; it resolves
  // successfully by default.
  deleteCalls = [];
  storage.destroy = async (publicId: string) => {
    deleteCalls.push(publicId);
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
    const created = await admin.saveProduct(baseInput(slug, []) as never);
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
          { storage: "cloudinary", objectKey: "rad/products/someone-elses-product-id/x" },
        ]) as never,
      ),
    );
  });

  test("rejects a forged objectKey that reuses another product's real id", async () => {
    const slugA = `cloudinary-forge-a-${Date.now()}`;
    const productA = await admin.saveProduct(baseInput(slugA, []) as never);
    const slugB = `cloudinary-forge-b-${Date.now()}`;
    // An admin crafts a key that *looks* legitimate (correct pattern) but
    // targets product A's namespace while saving product B — must still
    // be rejected because the validation is against *this* product's id.
    const forgedKey = `rad/products/${productA.id}/forged333`;
    await assert.rejects(() =>
      admin.saveProduct(baseInput(slugB, [{ storage: "cloudinary", objectKey: forgedKey }]) as never),
    );
  });

  test("slug rename regression: current code forbids changing slug after creation", async () => {
    const slug = `cloudinary-rename-${Date.now()}`;
    const baseline = await admin.saveProduct(baseInput(slug, []) as never);
    await assert.rejects(
      () => admin.saveProduct(baseInput(`${slug}-renamed`, []) as never, baseline.id),
      /شناسه URL پس از ایجاد قابل تغییر نیست/,
    );
  });

  test("duplicate/repeated save with the same cloudinary image payload is idempotent (no duplicate rows, no delete calls)", async () => {
    const slug = `cloudinary-dup-${Date.now()}`;
    const created = await admin.saveProduct(baseInput(slug, []) as never);
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
    assert.deepEqual(deleteCalls, [], "re-saving an unchanged image set must not delete anything");
  });

  test("removing one cloudinary image from a multi-image product deletes only the removed asset, post-commit", async () => {
    const slug = `cloudinary-partial-remove-${Date.now()}`;
    const created = await admin.saveProduct(baseInput(slug, []) as never);
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
    const created = await admin.saveProduct(baseInput(slug, []) as never);
    const key = `rad/products/${created.id}/stable777`;
    await admin.saveProduct(
      baseInput(slug, [{ storage: "cloudinary", objectKey: key }]) as never,
      created.id,
    );
    const before = await dataSource
      .getRepository(ProductImage)
      .find({ where: { productSlug: slug } });
    deleteCalls.length = 0;
    const input = { ...baseInput(slug, [{ storage: "cloudinary", objectKey: key }]), price: 2_000_000 };
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
    const created = await admin.saveProduct(baseInput(slug, []) as never);
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
    const created = await admin.saveProduct(baseInput(slug, []) as never);
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
      const after = await admin.saveProduct(baseInput(slug, []) as never, created.id);
      assert.equal(after.images.length, 0);
    } finally {
      storage.destroy = originalDestroy;
    }
    const rows = await dataSource
      .getRepository(ProductImage)
      .find({ where: { productSlug: slug } });
    assert.equal(rows.length, 0, "the DB-side removal must still have committed");
  });
});
