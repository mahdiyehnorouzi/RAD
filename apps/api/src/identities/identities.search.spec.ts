import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
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
import { IdentitiesService } from "./identities.service";

// A disposable, local-only Postgres instance (same pattern as
// identities.concurrency.spec.ts) — never the shared dev database, and
// torn down in `after`. The "82"-numbered identity created here exists
// only for the lifetime of this test file.

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

function productFields(slug: string, name: string) {
  return {
    slug,
    name,
    subtitle: name,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall" as const,
    category: "ceramics",
    status: "draft" as const,
    story: "story",
    details: ["تنها یک نسخه"],
    en: { name, subtitle: name, story: "story", details: ["One of one"] },
    sortOrder: 0,
    vendorId: null,
  };
}

let pg: EmbeddedPostgres;
let databaseDir: string;
let dataSource: DataSource;
let identities: IdentitiesService;

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-identity-search-"));
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
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
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

  // One disposable reserved identity, #82, with no product — the target
  // every digit-format variant below must resolve to.
  await dataSource.getRepository(RadIdentity).save(
    dataSource.getRepository(RadIdentity).create({
      radNumber: 82,
      status: "reserved",
      reservedAt: new Date(),
    }),
  );

  // A second identity whose number merely *contains* "82" as a substring
  // (#182), attached to a product with an unrelated name — this is what
  // must NOT show up for the mixed-alphanumeric name search below (it
  // has nothing to do with "fincan82 ویژه").
  const unrelatedProduct = await dataSource
    .getRepository(Product)
    .save(
      dataSource
        .getRepository(Product)
        .create(productFields("unrelated-182", "نامربوط")),
    );
  await dataSource.getRepository(RadIdentity).save(
    dataSource.getRepository(RadIdentity).create({
      radNumber: 182,
      status: "assigned",
      productId: unrelatedProduct.id,
      reservedAt: new Date(),
      assignedAt: new Date(),
    }),
  );

  // A product whose name happens to contain digits — "fincan82 ویژه" —
  // on an unrelated number, proving a mixed-text query stays a name
  // search rather than being (mis)interpreted as a numeric filter.
  const mixedNameProduct = await dataSource
    .getRepository(Product)
    .save(
      dataSource
        .getRepository(Product)
        .create(productFields("fincan82-special", "fincan82 ویژه")),
    );
  await dataSource.getRepository(RadIdentity).save(
    dataSource.getRepository(RadIdentity).create({
      radNumber: 571,
      status: "assigned",
      productId: mixedNameProduct.id,
      reservedAt: new Date(),
      assignedAt: new Date(),
    }),
  );
});

after(async () => {
  await dataSource?.destroy();
  await pg?.stop();
  rmSync(databaseDir, { recursive: true, force: true });
});

for (const [label, query] of [
  ["plain digits", "82"],
  ["a leading zero", "082"],
  ["Persian digits", "۰۸۲"],
  ["Arabic-Indic digits", "٠٨٢"],
  ["a RAD- prefix", "RAD-082"],
] as const) {
  test(`end-to-end: searching "${query}" (${label}) finds identity #82`, async () => {
    const rows = await identities.list({ q: query });
    assert.ok(
      rows.some((row) => row.radNumber === 82),
      `expected #82 among results for ${JSON.stringify(query)}`,
    );
  });
}

test("end-to-end: a mixed alphanumeric product-name query is preserved as a name search, not a numeric one", async () => {
  const rows = await identities.list({ q: "fincan82" });
  assert.ok(
    rows.some((row) => row.radNumber === 571),
    "the product literally named 'fincan82 ویژه' must be found by name",
  );
  assert.ok(
    !rows.some((row) => row.radNumber === 82),
    "a mixed-text query must not also pick up #82 by misreading embedded digits as a RAD number",
  );
});

test("end-to-end: combined filters (status + q) apply together, not just the last one", async () => {
  const reservedOnly = await identities.list({ q: "82", status: "reserved" });
  assert.ok(reservedOnly.some((row) => row.radNumber === 82));
  assert.ok(
    !reservedOnly.some((row) => row.radNumber === 182),
    "status=reserved must exclude #182 (assigned) even though it also matches the digits",
  );

  const assignedOnly = await identities.list({ q: "82", status: "assigned" });
  assert.ok(assignedOnly.some((row) => row.radNumber === 182));
  assert.ok(!assignedOnly.some((row) => row.radNumber === 82));
});

test("end-to-end: concurrent searches each get their own, correctly filtered result — no cross-talk at the DB layer", async () => {
  // The admin-side race guard (useLatestRequest) protects the UI from
  // applying a stale response; this proves the *query itself* is also
  // safe to run concurrently — two different filters resolved out of
  // order never bleed into each other's result set.
  const [reserved, assigned] = await Promise.all([
    identities.list({ q: "82", status: "reserved" }),
    identities.list({ q: "82", status: "assigned" }),
  ]);
  assert.ok(reserved.some((row) => row.radNumber === 82));
  assert.ok(!reserved.some((row) => row.radNumber === 182));
  assert.ok(assigned.some((row) => row.radNumber === 182));
  assert.ok(!assigned.some((row) => row.radNumber === 82));
});
