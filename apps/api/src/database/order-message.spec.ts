import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import { type DataSource } from "typeorm";
import { createAppDataSource } from "./data-source";
import { Order } from "./entities";
import { AddOrderMessage1793900000000 } from "./migrations/1793900000000-AddOrderMessage";

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
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-order-message-"));
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
  rmSync(databaseDir, { recursive: true, force: true });
});

function orderFixture(id: string) {
  return {
    id,
    ownerKey: `owner-${id}`,
    userId: null,
    total: 1_000_000,
    usdTotal: 10,
    status: "pending_payment",
    paymentDueAt: null,
    name: "خریدار تست",
    city: "تهران",
    phone: "09121234567",
    address: "خیابان ولیعصر",
    trackingCode: null,
    estimatedDeliveryAt: null,
    deliveredAt: null,
    policyVersions: null,
    policiesAcceptedAt: null,
  };
}

test("up() adds a nullable message column; a pre-existing row reads it as null", async () => {
  const orders = dataSource.getRepository(Order);
  // `synchronize: true` already created `message` (it's on the entity),
  // so insert an order through the live schema first, then drop the
  // column to simulate the real pre-migration shape, same approach as
  // the sibling AddUserContactPhone/AddUserGoogleAuth specs.
  const existing = await orders.save(
    orders.create(orderFixture("order-existing")),
  );

  const migration = new AddOrderMessage1793900000000();
  const runner = dataSource.createQueryRunner();
  try {
    await runner.connect();
    await runner.query(`ALTER TABLE "Order" DROP COLUMN "message"`);
    await migration.up(runner);
  } finally {
    await runner.release();
  }

  const reloadedExisting = await orders.findOneByOrFail({ id: existing.id });
  assert.equal(
    reloadedExisting.message,
    null,
    "a row written before the column existed reads back as null, not an error or empty string",
  );

  const created = await orders.save(
    orders.create({
      ...orderFixture("order-new"),
      message: "لطفاً با دقت بسته‌بندی شود.",
    }),
  );
  const reloadedCreated = await orders.findOneByOrFail({ id: created.id });
  assert.equal(reloadedCreated.message, "لطفاً با دقت بسته‌بندی شود.");

  const withoutMessage = await orders.save(
    orders.create({ ...orderFixture("order-no-message"), message: null }),
  );
  const reloadedWithoutMessage = await orders.findOneByOrFail({
    id: withoutMessage.id,
  });
  assert.equal(reloadedWithoutMessage.message, null);
});

test("down() drops the message column, losing any stored notes", async () => {
  const migration = new AddOrderMessage1793900000000();
  const runner = dataSource.createQueryRunner();
  try {
    await runner.connect();
    await migration.down(runner);
  } finally {
    await runner.release();
  }

  const columns: Array<{ column_name: string }> = await dataSource.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'message'`,
  );
  assert.equal(
    columns.length,
    0,
    "down() must remove the message column entirely",
  );

  // Re-apply up() so later tests (and `synchronize`) see the expected
  // post-migration shape again.
  const reRunner = dataSource.createQueryRunner();
  try {
    await reRunner.connect();
    await migration.up(reRunner);
  } finally {
    await reRunner.release();
  }
});
