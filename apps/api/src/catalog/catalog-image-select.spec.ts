import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../database/data-source";
import { isLocalDatabaseUrl } from "../database/safe-target";
import { Product, ProductImage } from "../database/entities";
import { publicCatalogQuery } from "./catalog.query";
import { stripImageSrc } from "./product.mapper";

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

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-catalog-"));
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
});

after(async () => {
  await dataSource?.destroy();
  await pg?.stop();
  if (databaseDir) rmSync(databaseDir, { recursive: true, force: true });
});

/**
 * Regression coverage for the public catalog query's `ProductImage.src`
 * projection: `static`/`external` rows need their real `src` to resolve a
 * usable path/URL. `legacy_base64` rows DO still carry their raw src at
 * this query layer (a plain column select — see `catalog.query.ts` for
 * why a DB-level CASE-based skip was reverted after it silently broke
 * hydration for every row); `stripImageSrc` is the layer that nulls it
 * before anything public-facing is built from it, covered below.
 */
describe("publicCatalogQuery image src projection", () => {
  test("static/external rows resolve their real src; stripImageSrc nulls legacy_base64's", async () => {
    const products = dataSource.getRepository(Product);
    const images = dataSource.getRepository(ProductImage);

    const slug = `catalog-select-test-${Date.now()}`;
    const product = await products.save(
      products.create({
        slug,
        name: "اثر آزمایشی",
        subtitle: "تنها یک نسخه",
        tomanPrice: 1_000_000,
        usdPrice: 12,
        color: "#8a4938",
        accent: "#ead9bd",
        shape: "tall",
        category: "ceramics",
        status: "available",
        story: "اثر آزمایشی",
        details: [],
        en: { name: slug, subtitle: "", story: "", details: [] },
      }),
    );

    const base64Payload = `data:image/png;base64,${Buffer.from(
      "legacy-base64-payload",
    ).toString("base64")}`;

    await images.save([
      images.create({
        product,
        alt: "static image",
        enAlt: "static image",
        sortOrder: 0,
        storage: "static",
        src: "/images/static-work.jpg",
      }),
      images.create({
        product,
        alt: "external image",
        enAlt: "external image",
        sortOrder: 1,
        storage: "external",
        src: "https://cdn.example.com/work.jpg",
      }),
      images.create({
        product,
        alt: "legacy image",
        enAlt: "legacy image",
        sortOrder: 2,
        storage: "legacy_base64",
        src: base64Payload,
      }),
      images.create({
        product,
        alt: "cloudinary image",
        enAlt: "cloudinary image",
        sortOrder: 3,
        storage: "cloudinary",
        objectKey: `rad/products/${product.id}/img1`,
        src: null,
      }),
      images.create({
        product,
        alt: "cloudinary video",
        enAlt: "cloudinary video",
        sortOrder: 4,
        storage: "cloudinary_video",
        objectKey: `rad/products/${product.id}/vid1`,
        src: null,
      }),
    ]);

    const row = await publicCatalogQuery(products)
      .andWhere("product.slug = :slug", { slug })
      .getOne();
    assert.ok(row, "expected the seeded product to be returned");

    const byStorage = new Map(
      (row!.images ?? []).map((image) => [image.storage, image]),
    );

    // At the raw query layer, legacy_base64's src IS the real payload — the
    // DB-level skip was reverted (see catalog.query.ts); application code
    // (stripImageSrc, asserted below) is what nulls it before anything
    // public-facing is built from it.
    assert.equal(byStorage.get("legacy_base64")?.src, base64Payload);
    assert.equal(byStorage.get("static")?.src, "/images/static-work.jpg");
    assert.equal(
      byStorage.get("external")?.src,
      "https://cdn.example.com/work.jpg",
    );

    // Regression test: a `cloudinary_video` row has `src: null` just like a
    // `cloudinary` row (both resolve their URL from `objectKey` at the
    // mapper layer, not a stored `src`). The query's LEFT JOIN condition
    // must admit BOTH storage kinds explicitly, or a src-less row for a
    // kind it doesn't name is silently dropped from the join entirely —
    // this is exactly the bug that made uploaded videos invisible on the
    // storefront (see catalog.query.ts).
    assert.ok(
      byStorage.has("cloudinary"),
      "expected the cloudinary image row to survive the join",
    );
    assert.ok(
      byStorage.has("cloudinary_video"),
      "expected the cloudinary_video row to survive the join — it must not be silently dropped",
    );
    assert.equal(
      byStorage.get("cloudinary_video")?.objectKey,
      `rad/products/${product.id}/vid1`,
    );

    // `stripImageSrc` (the mapper-layer defense in depth) must agree.
    const stripped = stripImageSrc(row!.images ?? []);
    const strippedByStorage = new Map(
      stripped.map((image) => [image.storage, image]),
    );
    assert.equal(strippedByStorage.get("legacy_base64")?.src, null);
    assert.equal(
      strippedByStorage.get("static")?.src,
      "/images/static-work.jpg",
    );
    assert.equal(
      strippedByStorage.get("external")?.src,
      "https://cdn.example.com/work.jpg",
    );
  });
});
