import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource, QueryRunner } from "typeorm";
import { createAppDataSource } from "./data-source";
import { isLocalDatabaseUrl } from "./safe-target";
import { Product, RadIdentity } from "./entities";
import { AddCategories1794500000000 } from "./migrations/1794500000000-AddCategories";
import { KNOWN_CATEGORY_SEEDS } from "../categories/const/category-seeds";

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

let pg: EmbeddedPostgres;
let databaseDir: string;
let dataSource: DataSource;

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-category-migration-"));
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

test("up seeds parents without rewriting products, and down drops only the new schema", async () => {
  const products = dataSource.getRepository(Product);
  const identities = dataSource.getRepository(RadIdentity);
  const kept = await products.save(
    products.create({
      slug: "moon-vase",
      name: "گلدان ماه",
      subtitle: "تنها یک نسخه",
      tomanPrice: 1_000_000,
      usdPrice: 12,
      color: "#8a4938",
      accent: "#ead9bd",
      shape: "tall",
      category: "ceramics",
      radNumber: 41,
      status: "available",
      story: "داستان",
      details: ["تنها یک نسخه"],
      en: { name: "Moon vase", subtitle: "", story: "", details: [] },
    }),
  );
  const extra = await products.save(
    products.create({
      slug: "legacy-object",
      name: "اثر قدیمی",
      subtitle: "تنها یک نسخه",
      tomanPrice: 1_000_000,
      usdPrice: 12,
      color: "#8a4938",
      accent: "#ead9bd",
      shape: "tall",
      category: "legacy-custom",
      radNumber: 42,
      status: "available",
      story: "داستان",
      details: [],
      en: { name: "Legacy", subtitle: "", story: "", details: [] },
    }),
  );
  const identity = await identities.save(
    identities.create({
      radNumber: 41,
      productId: kept.id,
      status: "assigned",
      reservedAt: new Date("2026-01-01T00:00:00.000Z"),
      assignedAt: new Date("2026-01-02T00:00:00.000Z"),
    }),
  );

  const migration = new AddCategories1794500000000();
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    await runner.query(
      `ALTER TABLE "Product" DROP COLUMN IF EXISTS "subcategoryId"`,
    );
    await runner.query(`DROP TABLE IF EXISTS "Category" CASCADE`);
    await runner.query(`DROP FUNCTION IF EXISTS category_parent_is_root()`);
    await migration.up(runner);

    const rows: Array<{
      id: string;
      slug: string;
      category: string;
      radNumber: number;
      subcategoryId: string | null;
    }> = await runner.query(
      `SELECT id, slug, category, "radNumber", "subcategoryId" FROM "Product" ORDER BY "radNumber"`,
    );
    assert.deepEqual(rows, [
      {
        id: kept.id,
        slug: "moon-vase",
        category: "ceramics",
        radNumber: 41,
        subcategoryId: null,
      },
      {
        id: extra.id,
        slug: "legacy-object",
        category: "legacy-custom",
        radNumber: 42,
        subcategoryId: null,
      },
    ]);
    const identityRow: Array<{ radNumber: number; productId: string }> =
      await runner.query(
        `SELECT "radNumber", "productId" FROM "RadIdentity" WHERE id = $1`,
        [identity.id],
      );
    assert.deepEqual(identityRow, [{ radNumber: 41, productId: kept.id }]);

    const categories: Array<{
      slug: string;
      parentId: string | null;
      name: { fa: string; en: string };
    }> = await runner.query(
      `SELECT slug, "parentId", name FROM "Category" ORDER BY "sortOrder", slug`,
    );
    assert.deepEqual(
      categories.map((category) => category.slug),
      [...KNOWN_CATEGORY_SEEDS.map((seed) => seed.slug), "legacy-custom"],
    );
    assert.ok(categories.every((category) => category.parentId === null));
    assert.deepEqual(categories[0].name, {
      fa: "سفال و سرامیک",
      en: "Ceramics",
    });
    const legacy = categories.find(
      (category) => category.slug === "legacy-custom",
    );
    assert.deepEqual(legacy?.name, {
      fa: "legacy-custom",
      en: "legacy-custom",
    });

    await assertHierarchyRejected(runner);

    const child: Array<{ id: string }> = await runner.query(
      `SELECT id FROM "Category" WHERE slug = 'mugs'`,
    );
    await runner.query(
      `UPDATE "Product" SET "subcategoryId" = $1 WHERE id = $2`,
      [child[0].id, kept.id],
    );
    await migration.down(runner);
  } finally {
    await runner.release();
  }

  const survived: Array<{
    id: string;
    slug: string;
    category: string;
    radNumber: number;
  }> = await dataSource.query(
    `SELECT id, slug, category, "radNumber" FROM "Product" ORDER BY "radNumber"`,
  );
  assert.deepEqual(survived, [
    { id: kept.id, slug: "moon-vase", category: "ceramics", radNumber: 41 },
    {
      id: extra.id,
      slug: "legacy-object",
      category: "legacy-custom",
      radNumber: 42,
    },
  ]);
  const columns: Array<{ column_name: string }> = await dataSource.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'Product' AND column_name = 'subcategoryId'`,
  );
  assert.equal(columns.length, 0);
  const tables: Array<{ table_name: string }> = await dataSource.query(
    `SELECT table_name FROM information_schema.tables WHERE table_name = 'Category'`,
  );
  assert.equal(tables.length, 0);
  const identityAfter: Array<{ radNumber: number; productId: string }> =
    await dataSource.query(
      `SELECT "radNumber", "productId" FROM "RadIdentity" WHERE id = $1`,
      [identity.id],
    );
  assert.deepEqual(identityAfter, [{ radNumber: 41, productId: kept.id }]);
});

async function assertHierarchyRejected(runner: QueryRunner) {
  const parents: Array<{ id: string }> = await runner.query(
    `SELECT id FROM "Category" WHERE slug = 'ceramics'`,
  );
  await runner.query(
    `INSERT INTO "Category" ("id", "slug", "parentId", "name", "active", "sortOrder")
     VALUES ('cat_mugs', 'mugs', $1, '{"fa":"ماگ","en":"Mugs"}'::jsonb, true, 0)`,
    [parents[0].id],
  );
  await assert.rejects(() =>
    runner.query(
      `INSERT INTO "Category" ("id", "slug", "parentId", "name", "active", "sortOrder")
       VALUES ('cat_cups', 'cups', 'cat_mugs', '{"fa":"فنجان","en":"Cups"}'::jsonb, true, 0)`,
    ),
  );
  await assert.rejects(() =>
    runner.query(
      `UPDATE "Category" SET "parentId" = "id" WHERE slug = 'ceramics'`,
    ),
  );
  await assert.rejects(() =>
    runner.query(
      `INSERT INTO "Category" ("id", "slug", "parentId", "name", "active", "sortOrder")
       VALUES ('cat_dup', 'ceramics', NULL, '{"fa":"تکراری","en":"Duplicate"}'::jsonb, true, 0)`,
    ),
  );
  await assert.rejects(() =>
    runner.query(
      `INSERT INTO "Category" ("id", "slug", "parentId", "name", "active", "sortOrder")
       VALUES ('cat_orphan', 'orphan', 'missing-parent', '{"fa":"یتیم","en":"Orphan"}'::jsonb, true, 0)`,
    ),
  );
}
