import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../database/data-source";
import { isLocalDatabaseUrl } from "../database/safe-target";
import { Category, Product } from "../database/entities";
import { CategoriesService } from "./categories.service";
import { resolveProductParentSlug } from "./resolve-product-parent";
import { resolveProductSubcategory } from "./resolve-product-subcategory";

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
let service: CategoriesService;

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-categories-"));
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
  service = new CategoriesService(
    dataSource.getRepository(Category),
    dataSource.getRepository(Product),
  );
});

after(async () => {
  await dataSource?.destroy();
  await pg?.stop();
  if (databaseDir) rmSync(databaseDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await dataSource.query(`DELETE FROM "Product"`);
  await dataSource.query(`DELETE FROM "Category"`);
});

async function makeProduct(
  category: string,
  subcategoryId: string | null = null,
) {
  const products = dataSource.getRepository(Product);
  const slug = `cat-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return products.save(
    products.create({
      slug,
      name: "اثر آزمایشی",
      subtitle: "تنها یک نسخه",
      tomanPrice: 1_000_000,
      usdPrice: 12,
      color: "#8a4938",
      accent: "#ead9bd",
      shape: "tall",
      category,
      subcategoryId,
      status: "available",
      story: "اثر آزمایشی",
      details: [],
      en: { name: slug, subtitle: "", story: "", details: [] },
    }),
  );
}

test("creates a parent and a child, and rejects an invalid parent", async () => {
  const parent = await service.create({
    slug: "ceramics",
    name: { fa: "سفال و سرامیک", en: "Ceramics" },
    sortOrder: 0,
  });
  assert.equal(parent.parentId, null);
  const child = await service.create({
    slug: "mugs",
    name: { fa: "ماگ", en: "Mugs" },
    parentId: parent.id,
  });
  assert.equal(child.parentId, parent.id);

  await assert.rejects(
    () =>
      service.create({
        slug: "cups",
        name: { fa: "فنجان", en: "Cups" },
        parentId: child.id,
      }),
    (error: unknown) =>
      error instanceof BadRequestException &&
      (error.getResponse() as { code?: string }).code === "category_depth",
  );
  await assert.rejects(
    () =>
      service.create({
        slug: "missing",
        name: { fa: "نیست", en: "Missing" },
        parentId: "does-not-exist",
      }),
    (error: unknown) =>
      error instanceof BadRequestException &&
      (error.getResponse() as { code?: string }).code ===
        "category_parent_missing",
  );
  await assert.rejects(
    () =>
      service.create({
        slug: "ceramics",
        name: { fa: "تکراری", en: "Duplicate" },
      }),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === "category_slug_taken",
  );
});

test("rejects self-parent and a slug change that products already use", async () => {
  const parent = await service.create({
    slug: "ceramics",
    name: { fa: "سفال و سرامیک", en: "Ceramics" },
  });
  await makeProduct("ceramics");
  await assert.rejects(
    () => service.update(parent.id, { parentId: parent.id }),
    (error: unknown) =>
      error instanceof BadRequestException &&
      (error.getResponse() as { code?: string }).code ===
        "category_self_parent",
  );
  await assert.rejects(
    () => service.update(parent.id, { slug: "clay" }),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code ===
        "category_slug_in_use",
  );
  const reloaded = await dataSource
    .getRepository(Category)
    .findOneByOrFail({ id: parent.id });
  assert.equal(reloaded.slug, "ceramics");
  assert.equal(reloaded.parentId, null);
});

test("deactivates a category that products use and refuses to delete it", async () => {
  const parent = await service.create({
    slug: "ceramics",
    name: { fa: "سفال و سرامیک", en: "Ceramics" },
  });
  const child = await service.create({
    slug: "mugs",
    name: { fa: "ماگ", en: "Mugs" },
    parentId: parent.id,
  });
  const product = await makeProduct("ceramics", child.id);
  const deactivated = await service.update(child.id, { active: false });
  assert.equal(deactivated.active, false);
  const stillThere = await dataSource
    .getRepository(Product)
    .findOneByOrFail({ id: product.id });
  assert.equal(stillThere.subcategoryId, child.id);
  assert.equal(stillThere.category, "ceramics");

  await assert.rejects(
    () => service.remove(child.id),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code === "category_in_use",
  );
  await assert.rejects(
    () => service.remove(parent.id),
    (error: unknown) => error instanceof ConflictException,
  );
  assert.equal(
    await dataSource
      .getRepository(Product)
      .count({ where: { id: product.id } }),
    1,
  );
});

test("refuses to move a subcategory that products use", async () => {
  const ceramics = await service.create({
    slug: "ceramics",
    name: { fa: "سفال", en: "Ceramics" },
  });
  const painting = await service.create({
    slug: "painting",
    name: { fa: "نقاشی", en: "Painting" },
  });
  const mugs = await service.create({
    slug: "mugs",
    name: { fa: "ماگ", en: "Mugs" },
    parentId: ceramics.id,
  });
  await makeProduct("ceramics", mugs.id);
  await assert.rejects(
    () => service.update(mugs.id, { parentId: painting.id }),
    (error: unknown) =>
      error instanceof ConflictException &&
      (error.getResponse() as { code?: string }).code ===
        "category_reparent_blocked",
  );
  const stuck = await dataSource
    .getRepository(Category)
    .findOneByOrFail({ id: mugs.id });
  assert.equal(stuck.parentId, ceramics.id);
  const product = await dataSource.getRepository(Product).findOneByOrFail({
    subcategoryId: mugs.id,
  });
  assert.equal(product.category, "ceramics");
});

test("public list returns active parents and active children in sort order", async () => {
  const later = await service.create({
    slug: "ceramics",
    name: { fa: "سفال و سرامیک", en: "Ceramics" },
    sortOrder: 2,
  });
  await service.create({
    slug: "painting",
    name: { fa: "نقاشی", en: "Painting" },
    sortOrder: 1,
  });
  await service.create({
    slug: "vases",
    name: { fa: "گلدان", en: "Vases" },
    sortOrder: 0,
    active: false,
  });
  await service.create({
    slug: "mugs",
    name: { fa: "ماگ", en: "Mugs" },
    parentId: later.id,
    sortOrder: 1,
  });
  await service.create({
    slug: "bowls",
    name: { fa: "کاسه", en: "Bowls" },
    parentId: later.id,
    sortOrder: 0,
    active: false,
  });

  const listed = await service.listPublic();
  assert.deepEqual(
    listed.map((category) => category.slug),
    ["painting", "ceramics"],
  );
  assert.deepEqual(
    listed[1].children.map((child) => child.slug),
    ["mugs"],
  );

  const admin = await service.listAdmin();
  assert.deepEqual(
    admin.map((category) => category.slug),
    ["vases", "painting", "ceramics"],
  );
  assert.equal(admin[2].children.length, 2);
  assert.equal(
    admin[2].children.find((child) => child.slug === "bowls")?.active,
    false,
  );
});

test("product subcategory must belong to the selected parent", async () => {
  const categories = dataSource.getRepository(Category);
  const ceramics = await service.create({
    slug: "ceramics",
    name: { fa: "سفال", en: "Ceramics" },
  });
  const painting = await service.create({
    slug: "painting",
    name: { fa: "نقاشی", en: "Painting" },
  });
  const mugs = await service.create({
    slug: "mugs",
    name: { fa: "ماگ", en: "Mugs" },
    parentId: ceramics.id,
  });

  assert.equal(
    await resolveProductSubcategory(categories, {
      storeCategory: "ceramics",
      subcategory: undefined,
      existingSubcategoryId: null,
    }),
    undefined,
  );
  assert.equal(
    await resolveProductSubcategory(categories, {
      storeCategory: "ceramics",
      subcategory: null,
      existingSubcategoryId: mugs.id,
    }),
    null,
  );
  assert.equal(
    await resolveProductSubcategory(categories, {
      storeCategory: "ceramics",
      subcategory: "mugs",
      existingSubcategoryId: null,
    }),
    mugs.id,
  );
  await assert.rejects(
    () =>
      resolveProductSubcategory(categories, {
        storeCategory: "painting",
        subcategory: "mugs",
        existingSubcategoryId: null,
      }),
    (error: unknown) =>
      error instanceof BadRequestException &&
      (error.getResponse() as { code?: string }).code ===
        "subcategory_parent_mismatch",
  );
  await assert.rejects(
    () =>
      resolveProductSubcategory(categories, {
        storeCategory: "ceramics",
        subcategory: "ceramics",
        existingSubcategoryId: null,
      }),
    (error: unknown) =>
      error instanceof BadRequestException &&
      (error.getResponse() as { code?: string }).code === "subcategory_invalid",
  );
  await assert.rejects(
    () =>
      resolveProductSubcategory(categories, {
        storeCategory: "painting",
        subcategory: undefined,
        existingSubcategoryId: mugs.id,
      }),
    (error: unknown) =>
      error instanceof BadRequestException &&
      (error.getResponse() as { code?: string }).code ===
        "subcategory_parent_mismatch",
  );
  assert.equal(painting.parentId, null);
});

test("a product parent accepts a category slug or a legacy Persian label", async () => {
  const categories = dataSource.getRepository(Category);
  await service.create({
    slug: "ceramics",
    name: { fa: "سفال و سرامیک", en: "Ceramics" },
    active: true,
  });
  const child = await service.create({
    slug: "mugs",
    name: { fa: "ماگ", en: "Mugs" },
    parentId: (await categories.findOneByOrFail({ slug: "ceramics" })).id,
    active: true,
  });
  assert.equal(
    await resolveProductParentSlug(categories, "ceramics"),
    "ceramics",
  );
  assert.equal(await resolveProductParentSlug(categories, "گلدان"), "ceramics");
  await assert.rejects(
    () => resolveProductParentSlug(categories, child.slug),
    (error: unknown) =>
      error instanceof BadRequestException &&
      (error.getResponse() as { code?: string }).code === "category_invalid",
  );
  await assert.rejects(
    () => resolveProductParentSlug(categories, "not-a-category"),
    (error: unknown) =>
      error instanceof BadRequestException &&
      (error.getResponse() as { code?: string }).code === "category_invalid",
  );
});
