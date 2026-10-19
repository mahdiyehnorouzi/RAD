/**
 * Real S3/SeaweedFS integration smoke test — NOT a unit test, does not
 * run as part of `npm test`. Run this ON the production VPS (or anywhere
 * that can reach the configured S3_ENDPOINT), against an ISOLATED TEST
 * bucket and an ISOLATED TEST database — never production.
 *
 * Exercises the full admin upload lifecycle end to end:
 *   1. Sign an image upload.
 *   2. Upload the image bytes via the presigned PUT URL.
 *   3. Verify the uploaded image.
 *   4. Save a product (in the isolated test DB) referencing it.
 *   5. Retrieve the image's delivery URL from the saved product.
 *   6. Confirm the image actually renders (HTTP GET on the delivery URL,
 *      checking status + Content-Type).
 *   7. Repeat steps 1-3 for a video.
 *   8. Multiple images on one product.
 *   9. Delete one image and replace it with a new upload.
 *
 * Safety:
 * - Refuses to run if S3_MEDIA_BUCKET resolves to "rad-public" (the
 *   production bucket name given in the task).
 * - Refuses to run if DATABASE_URL is set and does not look like a
 *   local/throwaway database (reuses the same isLocalDatabaseUrl guard
 *   `replace-images.spec.ts` uses) — or, if DATABASE_URL is unset
 *   entirely, spins up a throwaway embedded-postgres instance itself
 *   (same pattern already used by that spec file).
 * - Deletes every object and every DB row it created, even on failure.
 *
 * Usage (on the VPS, after setting real non-production S3 test
 * credentials):
 *   cd apps/api
 *   S3_ENDPOINT=http://127.0.0.1:8333 \
 *   S3_PUBLIC_ENDPOINT=https://media.rad-object.com \
 *   S3_REGION=us-east-1 \
 *   S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=... \
 *   S3_MEDIA_BUCKET=rad-test \
 *   npx tsx scripts/s3-integration-smoke-test.ts
 *
 * Exits non-zero on any failed step.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { ConfigService } from "@nestjs/config";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../src/database/data-source";
import { isLocalDatabaseUrl } from "../src/database/safe-target";
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
} from "../src/database/entities";
import { AdminService } from "../src/admin/admin.service";
import { CloudinaryStorageService } from "../src/storage/cloudinary-storage.service";
import { S3StorageService } from "../src/storage/s3-storage.service";
import { PaymentReviewService } from "../src/orders/payment-review.service";
import { InventoryService } from "../src/inventory/inventory.service";
import { NoticesService } from "../src/notices/notices.service";
import { MailService } from "../src/mail/mail.service";

const PRODUCTION_BUCKET = "rad-public";

let passed = 0;
let failed = 0;

async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${(error as Error).message}`);
    failed++;
    throw error; // stop at the first failure — later steps assume earlier ones succeeded
  }
}

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

/** A minimal, structurally-valid 1x1 PNG (real magic bytes + IHDR, matching what S3StorageService's sniffer requires). */
function makeTestPng(): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrBody = Buffer.alloc(13);
  ihdrBody.writeUInt32BE(1, 0); // width
  ihdrBody.writeUInt32BE(1, 4); // height
  ihdrBody[8] = 8;
  ihdrBody[9] = 2;
  const length = Buffer.alloc(4);
  length.writeUInt32BE(13, 0);
  return Buffer.concat([sig, length, Buffer.from("IHDR"), ihdrBody, Buffer.alloc(4)]);
}

/** A minimal, structurally-valid MP4 container (ftyp + moov boxes, matching S3StorageService's structural check). */
function makeTestMp4(): Buffer {
  function box(type: string, body: Buffer) {
    const size = Buffer.alloc(4);
    size.writeUInt32BE(8 + body.length, 0);
    return Buffer.concat([size, Buffer.from(type, "ascii"), body]);
  }
  const ftyp = box("ftyp", Buffer.alloc(8));
  const moov = box("moov", Buffer.alloc(0));
  return Buffer.concat([ftyp, moov]);
}

async function putToS3(uploadUrl: string, body: Buffer) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: new Uint8Array(body),
  });
  if (!response.ok) {
    throw new Error(`PUT to presigned URL failed: ${response.status} ${await response.text()}`);
  }
}

/** Narrows a SignedUpload to its S3 branch or throws — every call site in this script expects S3. */
function expectS3Signed(
  signed: Awaited<ReturnType<AdminService["signProductImageUpload"]>>,
) {
  if (signed.provider !== "s3") throw new Error(`expected provider "s3", got "${signed.provider}"`);
  return signed;
}

async function main() {
  const bucket = process.env.S3_MEDIA_BUCKET;
  if (!bucket) throw new Error("S3_MEDIA_BUCKET must be set to a TEST bucket, e.g. rad-test");
  if (bucket === PRODUCTION_BUCKET) {
    throw new Error(
      `S3_MEDIA_BUCKET is "${PRODUCTION_BUCKET}" — refusing to run against the production bucket. Use a test bucket.`,
    );
  }
  for (const name of ["S3_ENDPOINT", "S3_PUBLIC_ENDPOINT", "S3_REGION", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"]) {
    if (!process.env[name]) throw new Error(`${name} must be set (see this script's usage comment)`);
  }

  const providedDbUrl = process.env.DATABASE_URL;
  let pg: EmbeddedPostgres | undefined;
  let databaseDir: string | undefined;
  let databaseUrl: string;

  if (providedDbUrl) {
    if (!isLocalDatabaseUrl(providedDbUrl)) {
      throw new Error(
        "DATABASE_URL does not look like a local/throwaway database. Refusing to run against it. " +
          "Unset DATABASE_URL to let this script spin up its own disposable Postgres instead.",
      );
    }
    databaseUrl = providedDbUrl;
    console.log(`Using provided local test database: ${databaseUrl}`);
  } else {
    databaseDir = mkdtempSync(path.join(tmpdir(), "rad-s3-smoke-"));
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
    await pg.createDatabase("rad_smoke_test");
    databaseUrl = `postgresql://rad:rad@127.0.0.1:${port}/rad_smoke_test`;
    console.log(`Started disposable test database: ${databaseUrl}`);
  }

  const config = new ConfigService(process.env as Record<string, string>);
  const s3Storage = new S3StorageService(config);
  const cloudinaryStorage = new CloudinaryStorageService(config);

  let dataSource: DataSource | undefined;
  const createdObjectKeys: string[] = [];

  try {
    dataSource = createAppDataSource({ url: databaseUrl, synchronize: true } as never);
    await dataSource.initialize();

    const repo = dataSource.getRepository.bind(dataSource);
    const inventory = new InventoryService(dataSource);
    const notices = {
      notifyPaymentVerified: async () => {},
      notifyPaymentRejected: async () => {},
    } as unknown as NoticesService;
    const mail = new MailService(new ConfigService({}));
    const paymentReview = new PaymentReviewService(dataSource, inventory, notices, mail);
    const admin = new AdminService(
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
      s3Storage, // active provider for this smoke test
      cloudinaryStorage,
      s3Storage,
    );

    const slug = `s3-smoke-test-${Date.now()}`;
    let imageKey = "";
    let videoKey = "";
    let productId = "";

    await step("1-3. sign, upload, and verify an image", async () => {
      const signed = await admin.signProductImageUpload(slug, "image/png", makeTestPng().length);
      if (signed.provider !== "s3") throw new Error(`expected provider "s3", got "${signed.provider}"`);
      await putToS3(signed.uploadUrl, makeTestPng());
      const verified = await admin.verifyProductMedia(slug, signed.objectKey, "image");
      if (verified.storage !== "s3") throw new Error(`expected storage "s3", got "${verified.storage}"`);
      imageKey = signed.objectKey;
      createdObjectKeys.push(imageKey);
    });

    await step("4. save a product referencing the verified image", async () => {
      const saved = await admin.saveProduct({
        slug,
        name: "S3 Smoke Test Product",
        description: "Created by s3-integration-smoke-test.ts",
        category: "گلدان",
        price: 1_000_000,
        status: "available",
        artist: "Smoke Test",
        images: [{ storage: "s3", objectKey: imageKey }],
      } as never);
      productId = saved.id;
      if (!productId) throw new Error("saveProduct did not return an id");
    });

    let deliveryUrl = "";
    await step("5. retrieve the image delivery URL", async () => {
      const row = await dataSource!
        .getRepository(ProductImage)
        .findOneOrFail({ where: { productSlug: slug, storage: "s3" } });
      const base =
        process.env.S3_PUBLIC_MEDIA_BASE_URL?.trim() || process.env.S3_PUBLIC_ENDPOINT!.trim();
      deliveryUrl = `${base.replace(/\/+$/, "")}/${row.objectKey}`;
    });

    await step("6. confirm the image renders (HTTP GET)", async () => {
      const response = await fetch(deliveryUrl);
      if (!response.ok) throw new Error(`GET ${deliveryUrl} -> ${response.status}`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/"))
        throw new Error(`expected an image/* Content-Type, got "${contentType}"`);
    });

    await step("7. sign, upload, and verify a video", async () => {
      const signed = await admin.signProductImageUpload(slug, "video/mp4", makeTestMp4().length);
      if (signed.provider !== "s3") throw new Error(`expected provider "s3", got "${signed.provider}"`);
      await putToS3(signed.uploadUrl, makeTestMp4());
      const verified = await admin.verifyProductMedia(slug, signed.objectKey, "video");
      if (verified.storage !== "s3_video")
        throw new Error(`expected storage "s3_video", got "${verified.storage}"`);
      videoKey = signed.objectKey;
      createdObjectKeys.push(videoKey);
    });

    await step("8. save the product with multiple images (+ the video)", async () => {
      const signed2 = expectS3Signed(
        await admin.signProductImageUpload(slug, "image/png", makeTestPng().length),
      );
      await putToS3(signed2.uploadUrl, makeTestPng());
      await admin.verifyProductMedia(slug, signed2.objectKey, "image");
      createdObjectKeys.push(signed2.objectKey);

      const saved = await admin.saveProduct(
        {
          slug,
          name: "S3 Smoke Test Product",
          description: "Created by s3-integration-smoke-test.ts",
          category: "گلدان",
          price: 1_000_000,
          status: "available",
          artist: "Smoke Test",
          images: [
            { storage: "s3", objectKey: imageKey },
            { storage: "s3", objectKey: signed2.objectKey },
            { storage: "s3_video", objectKey: videoKey },
          ],
        } as never,
        productId,
      );
      if (saved.images.length !== 2) // s3_video is excluded from the public count, same as cloudinary_video
        throw new Error(`expected 2 public images, got ${saved.images.length}`);
      const rows = await dataSource!
        .getRepository(ProductImage)
        .find({ where: { productSlug: slug } });
      if (rows.length !== 3) throw new Error(`expected 3 ProductImage rows, got ${rows.length}`);
    });

    await step("9. delete one image and replace it with a new upload", async () => {
      const signed3 = expectS3Signed(
        await admin.signProductImageUpload(slug, "image/png", makeTestPng().length),
      );
      await putToS3(signed3.uploadUrl, makeTestPng());
      await admin.verifyProductMedia(slug, signed3.objectKey, "image");
      createdObjectKeys.push(signed3.objectKey);

      await admin.saveProduct(
        {
          slug,
          name: "S3 Smoke Test Product",
          description: "Created by s3-integration-smoke-test.ts",
          category: "گلدان",
          price: 1_000_000,
          status: "available",
          artist: "Smoke Test",
          images: [
            { storage: "s3", objectKey: signed3.objectKey }, // imageKey dropped, replaced
            { storage: "s3_video", objectKey: videoKey },
          ],
        } as never,
        productId,
      );
      const rows = await dataSource!
        .getRepository(ProductImage)
        .find({ where: { productSlug: slug } });
      if (rows.length !== 2) throw new Error(`expected 2 ProductImage rows after replace, got ${rows.length}`);
      if (rows.some((row) => row.objectKey === imageKey))
        throw new Error("the replaced image's row should have been deleted");
      // Confirm the dropped object was actually deleted from S3, not just the DB row.
      const head = await fetch(deliveryUrl);
      if (head.ok) throw new Error("the replaced object still exists in S3 after being dropped");
    });

    console.log(`\n${passed} passed, ${failed} failed.`);
  } finally {
    console.log("\nCleaning up test data...");
    for (const key of createdObjectKeys) {
      await s3Storage.destroy(key).catch(() => {});
    }
    if (dataSource) {
      const slugs = await dataSource.getRepository(Product).find({ where: {} });
      for (const product of slugs.filter((p) => p.slug.startsWith("s3-smoke-test-"))) {
        await dataSource.getRepository(ProductImage).delete({ productSlug: product.slug });
        await dataSource.getRepository(Product).delete({ id: product.id });
      }
      await dataSource.destroy();
    }
    if (pg) await pg.stop();
    if (databaseDir) rmSync(databaseDir, { recursive: true, force: true });
  }
}

main()
  .then(() => {
    if (failed > 0) process.exit(1);
  })
  .catch((error) => {
    console.error("\nSmoke test aborted:", error.message);
    process.exit(1);
  });
