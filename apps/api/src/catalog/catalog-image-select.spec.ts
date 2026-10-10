import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../database/data-source";
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

  dataSource = createAppDataSource({
    url: `postgresql://rad:rad@127.0.0.1:${port}/rad_test`,
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
 * projection: `legacy_base64` rows must never return their raw base64
 * payload to the public query path, while `static`/`external` rows still
 * need their real `src` to resolve a usable path/URL.
 */
describe("publicCatalogQuery image src projection", () => {
  test("static/external rows keep src, legacy_base64 rows do not", async () => {
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
    ]);

    const row = await publicCatalogQuery(products)
      .andWhere("product.slug = :slug", { slug })
      .getOne();
    assert.ok(row, "expected the seeded product to be returned");

    const byStorage = new Map(
      (row!.images ?? []).map((image) => [image.storage, image]),
    );

    // The query itself must never hydrate the legacy row's base64 payload —
    // this is the actual DB-level fix: no row carries it back on this path.
    assert.equal(byStorage.get("legacy_base64")?.src, null);
    assert.equal(byStorage.get("static")?.src, "/images/static-work.jpg");
    assert.equal(
      byStorage.get("external")?.src,
      "https://cdn.example.com/work.jpg",
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
