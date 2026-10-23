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
  PasswordResetToken,
  PaymentIntent,
  Product,
  ProductAttribute,
  ProductAttributeCategory,
  ProductAttributeOption,
  ProductAttributeValue,
  ProductImage,
  Review,
  User,
  Vendor,
} from "../database/entities";
import { AdminService } from "./admin.service";
import { ProductAttributesService } from "../product-attributes/product-attributes.service";
import { PaymentReviewService } from "../orders/payment-review.service";
import { InventoryService } from "../inventory/inventory.service";
import { NoticesService } from "../notices/notices.service";
import { MailService } from "../mail/mail.service";
import { CloudinaryStorageService } from "../storage/cloudinary-storage.service";
import {
  createMediaStorageResolver,
  type MediaStorageService,
} from "../storage/media-storage.interface";
import {
  __resetIssuedUploadsForTests,
  recordIssuedUpload,
} from "../storage/upload-intent";

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
    repo(PasswordResetToken),
    inventory,
    paymentReview,
    new ProductAttributesService(
      repo(ProductAttribute),
      repo(ProductAttributeOption),
      repo(ProductAttributeCategory),
      repo(ProductAttributeValue),
    ),
    storage,
    () => storage,
    mail,
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

describe("AdminService.saveProduct — subtitle preservation (description/subtitle/story naming fix)", () => {
  /**
   * Regression test: `updateProduct` previously re-derived `subtitle` from
   * Admin's "description" textarea (truncated to 48 chars) on EVERY save,
   * silently discarding whatever `subtitle` held — including a value the
   * public API's `/artworks/:key` `description` field reads directly (see
   * `artwork.mapper.ts`). A new product still gets a sane `subtitle`
   * derived once at creation (nothing to preserve yet); an update must
   * never touch it again.
   */
  test("subtitle survives an update that only changes the admin description/story", async () => {
    const slug = `subtitle-preserve-${Date.now()}`;
    const created = await admin.saveProduct(
      baseInput(slug, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const createdRow = await dataSource
      .getRepository(Product)
      .findOneOrFail({ where: { id: created.id } });
    const originalSubtitle = createdRow.subtitle;
    assert.ok(originalSubtitle, "expected a derived subtitle on creation");

    await admin.saveProduct(
      {
        ...baseInput(slug, [{ storage: "static", src: "/catalog/test.jpg" }]),
        description: "متن کاملاً متفاوت و طولانی‌تر برای داستان این اثر هنری",
      } as never,
      created.id,
    );

    const updatedRow = await dataSource
      .getRepository(Product)
      .findOneOrFail({ where: { id: created.id } });
    assert.equal(
      updatedRow.subtitle,
      originalSubtitle,
      "subtitle must not be silently overwritten by an unrelated description/story edit",
    );
    assert.equal(
      updatedRow.story,
      "متن کاملاً متفاوت و طولانی‌تر برای داستان این اثر هنری",
      "story must still update normally from the description field",
    );
  });
});

describe("AdminService — SeaweedFS fail-closed ownership (upload-intent audit fix)", () => {
  let seaweedfsAdmin: AdminService;
  let seaweedfsDeleteCalls: string[];

  before(() => {
    const seaweedfsStub: MediaStorageService = {
      createSignedUpload: () => {
        throw new Error("not used directly in these tests");
      },
      verifyMedia: async (objectKey, kind) => ({
        objectKey,
        storage: kind === "video" ? "seaweedfs_video" : "seaweedfs",
      }),
      destroy: async (objectKey: string) => {
        seaweedfsDeleteCalls.push(objectKey);
      },
    };
    const cloudinaryStub: MediaStorageService = {
      createSignedUpload: () => {
        throw new Error("not used in these tests");
      },
      verifyMedia: async (objectKey, kind) => ({
        objectKey,
        storage: kind === "video" ? "cloudinary_video" : "cloudinary",
      }),
      destroy: async () => {},
    };
    const resolver = createMediaStorageResolver(cloudinaryStub, seaweedfsStub);
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
    seaweedfsAdmin = new AdminService(
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
      repo(PasswordResetToken),
      inventory,
      paymentReview,
      new ProductAttributesService(
        repo(ProductAttribute),
        repo(ProductAttributeOption),
        repo(ProductAttributeCategory),
        repo(ProductAttributeValue),
      ),
      seaweedfsStub,
      resolver,
      mail,
    );
  });

  // Every test starts and ends with a clean in-memory intent map — the
  // whole point of these tests is to control exactly which keys this
  // "process" claims to have minted.
  function resetIntents() {
    seaweedfsDeleteCalls = [];
    __resetIssuedUploadsForTests();
  }

  test("rejects a brand-new objectKey with no recorded upload intent at all (never attached before, never signed by this process)", async () => {
    resetIntents();
    const slug = `seaweedfs-no-intent-${Date.now()}`;
    await assert.rejects(
      () =>
        seaweedfsAdmin.saveProduct(
          baseInput(slug, [
            { storage: "seaweedfs", objectKey: "rad/pending/noIntentAtAll" },
          ]) as never,
        ),
      /upload_intent_expired|نشست بارگذاری/,
    );
    __resetIssuedUploadsForTests();
  });

  test("rejects an expired upload intent (minted long enough ago to fall outside UPLOAD_INTENT_MAX_AGE_MS)", async () => {
    resetIntents();
    const objectKey = "rad/pending/expiredIntent";
    const twoHoursAndOneMinuteAgo = Date.now() - (2 * 60 * 60 * 1000 + 60_000);
    recordIssuedUpload(objectKey, null, "image", twoHoursAndOneMinuteAgo);
    const slug = `seaweedfs-expired-${Date.now()}`;
    await assert.rejects(
      () =>
        seaweedfsAdmin.saveProduct(
          baseInput(slug, [{ storage: "seaweedfs", objectKey }]) as never,
        ),
      /upload_intent_expired|نشست بارگذاری/,
    );
    __resetIssuedUploadsForTests();
  });

  test("rejects an intent recorded for a different, already-real product id", async () => {
    resetIntents();
    const slugA = `seaweedfs-other-product-a-${Date.now()}`;
    const productA = await seaweedfsAdmin.saveProduct(
      baseInput(slugA, [
        { storage: "static", src: "/catalog/test.jpg" },
      ]) as never,
    );
    const objectKey = `rad/products/${productA.id}/belongsToA`;
    recordIssuedUpload(objectKey, productA.id, "image");
    const slugB = `seaweedfs-other-product-b-${Date.now()}`;
    await assert.rejects(() =>
      seaweedfsAdmin.saveProduct(
        baseInput(slugB, [{ storage: "seaweedfs", objectKey }]) as never,
      ),
    );
    __resetIssuedUploadsForTests();
  });

  test("rejects when the recorded intent's kind (image/video) doesn't match what's being claimed", async () => {
    resetIntents();
    const objectKey = "rad/pending/wrongKind";
    recordIssuedUpload(objectKey, null, "video");
    const slug = `seaweedfs-wrong-kind-${Date.now()}`;
    await assert.rejects(() =>
      seaweedfsAdmin.saveProduct(
        baseInput(slug, [{ storage: "seaweedfs", objectKey }]) as never,
      ),
    );
    __resetIssuedUploadsForTests();
  });

  test("simulated API restart: an intent recorded, then the in-memory map cleared (as on process restart), is rejected — never falls back to namespace shape alone", async () => {
    resetIntents();
    const objectKey = "rad/pending/restartCase";
    recordIssuedUpload(objectKey, null, "image");
    __resetIssuedUploadsForTests(); // simulates the process restarting
    const slug = `seaweedfs-restart-${Date.now()}`;
    await assert.rejects(() =>
      seaweedfsAdmin.saveProduct(
        baseInput(slug, [{ storage: "seaweedfs", objectKey }]) as never,
      ),
    );
  });

  test("a valid, matching intent for a brand-new (pre-creation) upload is accepted", async () => {
    resetIntents();
    const objectKey = "rad/pending/validNewUpload";
    recordIssuedUpload(objectKey, null, "image");
    const slug = `seaweedfs-valid-new-${Date.now()}`;
    const saved = await seaweedfsAdmin.saveProduct(
      baseInput(slug, [{ storage: "seaweedfs", objectKey }]) as never,
    );
    assert.equal(saved.images.length, 1);
    const row = await dataSource
      .getRepository(ProductImage)
      .findOneOrFail({ where: { productSlug: slug } });
    assert.equal(row.objectKey, objectKey);
    __resetIssuedUploadsForTests();
  });

  test("re-editing a product whose image is ALREADY a persisted ProductImage row needs no intent — the durable DB row alone is proof, even after a simulated restart", async () => {
    resetIntents();
    const objectKey = "rad/pending/alreadyAttached";
    recordIssuedUpload(objectKey, null, "image");
    const slug = `seaweedfs-reedit-${Date.now()}`;
    const created = await seaweedfsAdmin.saveProduct(
      baseInput(slug, [{ storage: "seaweedfs", objectKey }]) as never,
    );
    __resetIssuedUploadsForTests(); // simulate restart — no intent survives
    // Re-saving the SAME product with the SAME already-attached image must
    // still succeed: the durable ProductImage row (not the in-memory
    // intent) is what proves ownership here.
    const resaved = await seaweedfsAdmin.saveProduct(
      baseInput(slug, [{ storage: "seaweedfs", objectKey }]) as never,
      created.id,
    );
    assert.equal(resaved.images.length, 1);
  });

  test("rejects an attempt to attach an object that is ALREADY attached to a DIFFERENT product (no intent can override an existing row's ownership)", async () => {
    resetIntents();
    const objectKey = "rad/pending/stolenFromOther";
    recordIssuedUpload(objectKey, null, "image");
    const slugA = `seaweedfs-steal-victim-${Date.now()}`;
    await seaweedfsAdmin.saveProduct(
      baseInput(slugA, [{ storage: "seaweedfs", objectKey }]) as never,
    );
    // A second product tries to claim the same objectKey. Even recording a
    // *fresh* intent for product B must not help — the row already belongs
    // to product A.
    recordIssuedUpload(objectKey, null, "image");
    const slugB = `seaweedfs-steal-attacker-${Date.now()}`;
    await assert.rejects(() =>
      seaweedfsAdmin.saveProduct(
        baseInput(slugB, [{ storage: "seaweedfs", objectKey }]) as never,
      ),
    );
    __resetIssuedUploadsForTests();
  });

  test("repeated verification of the same objectKey against the same product (re-submitting the form without changes) stays authorized", async () => {
    resetIntents();
    const objectKey = "rad/pending/repeatedVerify";
    recordIssuedUpload(objectKey, null, "image");
    const slug = `seaweedfs-repeat-${Date.now()}`;
    const first = await seaweedfsAdmin.verifyProductMedia(
      slug,
      objectKey,
      "image",
    );
    const second = await seaweedfsAdmin.verifyProductMedia(
      slug,
      objectKey,
      "image",
    );
    assert.equal(first.objectKey, objectKey);
    assert.equal(second.objectKey, objectKey);
    __resetIssuedUploadsForTests();
  });
});
