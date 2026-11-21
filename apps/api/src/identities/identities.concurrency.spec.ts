import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { formatRadCode } from "@rad/types";
import EmbeddedPostgres from "embedded-postgres";
import { type DataSource } from "typeorm";
import { createAppDataSource } from "../database/data-source";
import {
  Product,
  RadIdentity,
  RadIdentityBatch,
  RadIdentityEvent,
} from "../database/entities";
import { AddRadIdentity1794000000000 } from "../database/migrations/1794000000000-AddRadIdentity";
import {
  assignReservedIdentity,
  insertProductWithIdentity,
  reserveIdentityBatch,
} from "./identity.allocator";
import { IdentityPrintService } from "./identity-print.service";
import { IdentitiesService } from "./identities.service";
import { plannedSeedRadNumber } from "../../seed/identity-seed";

function freePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createNetServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function productFields(slug: string) {
  return {
    slug,
    name: slug,
    subtitle: slug,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall" as const,
    category: "ceramics",
    status: "draft",
    story: "story",
    details: ["تنها یک نسخه"],
    en: { name: slug, subtitle: slug, story: "story", details: ["One of one"] },
    sortOrder: 0,
    vendorId: null,
  };
}

let pg: EmbeddedPostgres;
let databaseDir: string;
let dataSource: DataSource;
let identities: IdentitiesService;
let http: Server;
let httpPort = 0;

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-identity-"));
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
  const products = dataSource.getRepository(Product);
  await products.save(
    products.create({
      ...productFields("legacy-woven"),
      radNumber: 60,
      status: "available",
    }),
  );
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    await new AddRadIdentity1794000000000().up(runner);
    await new AddRadIdentity1794000000000().up(runner);
  } finally {
    await runner.release();
  }
  identities = new IdentitiesService(
    dataSource,
    dataSource.getRepository(RadIdentity),
    dataSource.getRepository(RadIdentityBatch),
    dataSource.getRepository(RadIdentityEvent),
    dataSource.getRepository(Product),
  );
  http = createServer((req, response) => {
    const code = req.url?.split("/r/")[1]?.split("?")[0] ?? "";
    response.writeHead(200, { "content-type": "text/html" });
    response.end(`<main data-rad-code="${code}"></main>`);
  });
  await new Promise<void>((resolve) => http.listen(0, "127.0.0.1", resolve));
  const address = http.address();
  httpPort = typeof address === "object" && address ? address.port : 0;
});

after(async () => {
  http?.close();
  await dataSource?.destroy();
  await pg?.stop();
  rmSync(databaseDir, { recursive: true, force: true });
});

test("migration keeps an existing product number and can run twice", async () => {
  const rows = await dataSource.getRepository(RadIdentity).find({
    where: { radNumber: 60 },
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, "assigned");
  const product = await dataSource.getRepository(Product).findOneByOrFail({
    radNumber: 60,
  });
  assert.equal(rows[0].productId, product.id);
});

test("the first reservation continues after the highest stored number", async () => {
  const reserved = await reserveIdentityBatch(dataSource, {
    quantity: 3,
    idempotencyKey: "first-batch-001",
    createdById: null,
  });
  assert.deepEqual(
    reserved.identities.map((row) => row.radNumber),
    [61, 62, 63],
  );
  assert.equal(reserved.replayed, false);
});

test("repeating a batch request does not reserve more numbers", async () => {
  const again = await reserveIdentityBatch(dataSource, {
    quantity: 3,
    idempotencyKey: "first-batch-001",
    createdById: null,
  });
  assert.equal(again.replayed, true);
  assert.equal(again.batch.startNumber, 61);
  const count = await dataSource.getRepository(RadIdentity).count({
    where: { batchId: again.batch.id },
  });
  assert.equal(count, 3);
});

test("concurrent batches and product creation never share a number", async () => {
  const [first, second, created] = await Promise.all([
    reserveIdentityBatch(dataSource, {
      quantity: 5,
      idempotencyKey: "concurrent-a-01",
      createdById: null,
    }),
    reserveIdentityBatch(dataSource, {
      quantity: 5,
      idempotencyKey: "concurrent-b-01",
      createdById: null,
    }),
    insertProductWithIdentity(dataSource, productFields("during-batch")),
  ]);
  const numbers = [
    ...first.identities.map((row) => row.radNumber),
    ...second.identities.map((row) => row.radNumber),
    created.radNumber,
  ];
  assert.equal(new Set(numbers).size, numbers.length);
  assert.equal(numbers.filter((value) => value == null).length, 0);
});

test("a duplicate identity number is rejected by the database", async () => {
  await assert.rejects(() =>
    dataSource.query(
      `INSERT INTO "RadIdentity"
        ("id", "radNumber", "status", "reservedAt", "createdAt", "updatedAt")
       VALUES ('dup-60', 60, 'reserved', now(), now(), now())`,
    ),
  );
});

test("a reserved number can be attached once and then refuses a second product", async () => {
  const reserved = await reserveIdentityBatch(dataSource, {
    quantity: 1,
    idempotencyKey: "assign-once-01",
    createdById: null,
  });
  const identity = reserved.identities[0];
  const product = await insertProductWithIdentity(
    dataSource,
    productFields("uses-reserved"),
    identity.radNumber,
  );
  assert.equal(product.radNumber, identity.radNumber);
  const linked = await dataSource.getRepository(RadIdentity).findOneByOrFail({
    id: identity.id,
  });
  assert.equal(linked.status, "assigned");
  assert.equal(linked.productId, product.id);
  await assert.rejects(
    () =>
      insertProductWithIdentity(
        dataSource,
        productFields("uses-reserved-again"),
        identity.radNumber,
      ),
    (error: unknown) => {
      assert.equal(
        (error as { response?: { code?: string } }).response?.code,
        "identity_unavailable",
      );
      return true;
    },
  );
  await assert.rejects(() =>
    assignReservedIdentity(dataSource, identity.id, product.id),
  );
});

test("an existing product number cannot be changed", async () => {
  await assert.rejects(() =>
    dataSource.query(
      `UPDATE "Product" SET "radNumber" = 7 WHERE "radNumber" = 60`,
    ),
  );
});

test("deleting a product retires its number and the next allocation does not reuse it", async () => {
  const created = await insertProductWithIdentity(
    dataSource,
    productFields("to-delete"),
  );
  const number = created.radNumber;
  await dataSource.getRepository(Product).delete({ id: created.id });
  const identity = await dataSource.getRepository(RadIdentity).findOneByOrFail({
    radNumber: number!,
  });
  assert.equal(identity.status, "retired");
  assert.equal(identity.productId, null);
  const next = await insertProductWithIdentity(
    dataSource,
    productFields("after-delete"),
  );
  assert.notEqual(next.radNumber, number);
});

test("seed planning never takes a reserved or retired number", () => {
  assert.equal(
    plannedSeedRadNumber({
      recordNumber: 90,
      existingProductId: null,
      existingProductNumber: null,
      holderProductId: null,
      identity: { status: "reserved", productId: null },
    }),
    null,
  );
  assert.equal(
    plannedSeedRadNumber({
      recordNumber: 90,
      existingProductId: "same",
      existingProductNumber: 12,
      holderProductId: null,
      identity: null,
    }),
    12,
  );
});

test("a reserved identity is public and a draft stays private", async () => {
  const reserved = await identities.resolvePublic("061");
  assert.equal(reserved?.storyPublished, false);
  assert.equal(reserved?.passportPath, null);
  assert.equal("name" in (reserved ?? {}), false);
  const draft = await insertProductWithIdentity(
    dataSource,
    productFields("still-draft"),
  );
  const hidden = await identities.resolvePublic(String(draft.radNumber));
  assert.equal(hidden?.storyPublished, false);
  await dataSource
    .getRepository(Product)
    .update({ id: draft.id }, { status: "available", slug: "renamed-draft" });
  const published = await identities.resolvePublic(String(draft.radNumber));
  assert.equal(published?.storyPublished, true);
  assert.equal(
    published?.passportPath,
    `/passport/${formatRadCode(draft.radNumber!)}`,
  );
  assert.equal(published?.passportPath?.includes("renamed-draft"), false);
});

test("a missing identity is distinct from a known reserved one", async () => {
  assert.equal(await identities.resolvePublic("99999"), null);
  assert.equal(await identities.resolvePublic("nope"), null);
});

test("marking a batch printed requires the public URL and does not run when it fails", async () => {
  const batch = await reserveIdentityBatch(dataSource, {
    quantity: 1,
    idempotencyKey: "print-batch-01",
    createdById: null,
  });
  const print = new IdentityPrintService(dataSource, identities);
  const previous = process.env.RAD_IDENTITY_PUBLIC_ORIGIN;
  try {
    process.env.RAD_IDENTITY_PUBLIC_ORIGIN = "http://127.0.0.1:9";
    await assert.rejects(() => print.markPrinted(batch.batch.id));
    const unmarked = await dataSource
      .getRepository(RadIdentityBatch)
      .findOneByOrFail({ id: batch.batch.id });
    assert.equal(unmarked.printedAt, null);
    process.env.RAD_IDENTITY_PUBLIC_ORIGIN = `http://127.0.0.1:${httpPort}`;
    const marked = await print.markPrinted(batch.batch.id);
    assert.equal(typeof marked.printedAt, "number");
  } finally {
    if (previous === undefined) delete process.env.RAD_IDENTITY_PUBLIC_ORIGIN;
    else process.env.RAD_IDENTITY_PUBLIC_ORIGIN = previous;
  }
});
