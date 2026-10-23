import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../database/data-source";
import { isLocalDatabaseUrl } from "../database/safe-target";
import {
  Product,
  ProductAttribute,
  ProductAttributeCategory,
  ProductAttributeOption,
  ProductAttributeValue,
} from "../database/entities";
import { ProductAttributesService } from "./product-attributes.service";

/**
 * DB-backed coverage for attribute CRUD, category scoping, required
 * validation, and the "never silently delete a value" rule across a
 * category change. Requires embedded-postgres, which needs to spin up a
 * real Postgres server — this sandbox's Docker/root restrictions block
 * that (same limitation noted in `catalog-image-select.spec.ts` and
 * `replace-images.spec.ts`), so this file is not expected to pass in this
 * environment. It is written to run as-is anywhere embedded-postgres can
 * start (a normal dev machine or CI).
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
let service: ProductAttributesService;

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-attributes-"));
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
    throw new Error("Refusing to run DB-backed tests against a non-local database.");
  }
  dataSource = createAppDataSource({ url: testDatabaseUrl, synchronize: true } as never);
  await dataSource.initialize();
  service = new ProductAttributesService(
    dataSource.getRepository(ProductAttribute),
    dataSource.getRepository(ProductAttributeOption),
    dataSource.getRepository(ProductAttributeCategory),
    dataSource.getRepository(ProductAttributeValue),
  );
});

after(async () => {
  await dataSource?.destroy();
  await pg?.stop();
  if (databaseDir) rmSync(databaseDir, { recursive: true, force: true });
});

async function makeProduct(category: string) {
  const products = dataSource.getRepository(Product);
  const slug = `attr-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
      status: "available",
      story: "اثر آزمایشی",
      details: [],
      en: { name: slug, subtitle: "", story: "", details: [] },
    }),
  );
}

describe("ProductAttributesService", () => {
  test("create + byCategory: a select attribute assigned to a category is returned, scoped by category", async () => {
    const attribute = await service.create({
      key: `color-${Date.now()}`,
      label: "رنگ",
      inputType: "select",
      unit: null,
      required: true,
      active: true,
      categories: ["گلدان"],
      options: [{ value: "white", label: "سفید" }, { value: "black", label: "مشکی" }],
    });
    assert.equal(attribute.categories.includes("گلدان"), true);
    assert.equal(attribute.options.length, 2);

    const forVase = await service.byCategory("گلدان");
    assert.ok(forVase.some((item) => item.id === attribute.id));

    const forOther = await service.byCategory("مجسمه");
    assert.equal(forOther.some((item) => item.id === attribute.id), false);
  });

  test("saveValuesForProduct: rejects a save missing a required attribute for the product's category", async () => {
    const attribute = await service.create({
      key: `height-${Date.now()}`,
      label: "ارتفاع",
      inputType: "number",
      unit: "سانتی‌متر",
      required: true,
      active: true,
      categories: ["مجسمه"],
      options: [],
    });
    const product = await makeProduct("sculpture");
    await assert.rejects(
      () => service.saveValuesForProduct(product.id, "sculpture", {}),
      BadRequestException,
    );
    await service.saveValuesForProduct(product.id, "sculpture", {
      [attribute.id]: 42,
    });
    const stored = await service.valuesForProduct(product.id);
    assert.equal(stored[attribute.id], 42);
  });

  test("saveValuesForProduct: a value for an attribute outside the product's new category is kept, not deleted", async () => {
    const vaseAttribute = await service.create({
      key: `glaze-${Date.now()}`,
      label: "لعاب",
      inputType: "text",
      unit: null,
      required: false,
      active: true,
      categories: ["گلدان"],
      options: [],
    });
    const product = await makeProduct("ceramics");
    await service.saveValuesForProduct(product.id, "ceramics", {
      [vaseAttribute.id]: "مات",
    });

    // Product's category changes to one this attribute is not assigned to;
    // no values are submitted for it, but the stored row must survive.
    await service.saveValuesForProduct(product.id, "sculpture", {});
    const stored = await service.valuesForProduct(product.id);
    assert.equal(stored[vaseAttribute.id], "مات");

    const display = await service.displayAttributesForProducts([
      { id: product.id, category: "sculpture" },
    ]);
    assert.equal(display.get(product.id)?.length, 0);

    const displayBack = await service.displayAttributesForProducts([
      { id: product.id, category: "ceramics" },
    ]);
    assert.deepEqual(displayBack.get(product.id), [
      { key: vaseAttribute.key, label: "لعاب", value: "مات" },
    ]);
  });

  test("remove: blocked once a product has a stored value, allowed once there is none", async () => {
    const attribute = await service.create({
      key: `removable-${Date.now()}`,
      label: "حذف‌شدنی",
      inputType: "text",
      unit: null,
      required: false,
      active: true,
      categories: ["گلدان"],
      options: [],
    });
    const product = await makeProduct("ceramics");
    await service.saveValuesForProduct(product.id, "ceramics", {
      [attribute.id]: "مقدار",
    });
    await assert.rejects(() => service.remove(attribute.id), ConflictException);

    const other = await service.create({
      key: `removable2-${Date.now()}`,
      label: "حذف‌شدنی دو",
      inputType: "text",
      unit: null,
      required: false,
      active: true,
      categories: ["گلدان"],
      options: [],
    });
    assert.deepEqual(await service.remove(other.id), { ok: true });
  });
});
