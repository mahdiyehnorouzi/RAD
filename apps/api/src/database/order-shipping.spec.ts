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
import { AddOrderShipping1794100000000 } from "./migrations/1794100000000-AddOrderShipping";

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
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-order-shipping-"));
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

test("up() adds shipping method and a zero default fee for existing orders", async () => {
  const orders = dataSource.getRepository(Order);
  const existing = await orders.save(
    orders.create({
      ...orderFixture("order-existing"),
      shippingMethod: "express",
      shippingFee: 150_000,
    }),
  );

  const migration = new AddOrderShipping1794100000000();
  const runner = dataSource.createQueryRunner();
  try {
    await runner.connect();
    await runner.query(`ALTER TABLE "Order" DROP COLUMN "shippingFee"`);
    await runner.query(`ALTER TABLE "Order" DROP COLUMN "shippingMethod"`);
    await migration.up(runner);
  } finally {
    await runner.release();
  }

  const reloaded = await orders.findOneByOrFail({ id: existing.id });
  assert.equal(reloaded.shippingMethod, null);
  assert.equal(reloaded.shippingFee, 0);

  const created = await orders.save(
    orders.create({
      ...orderFixture("order-express"),
      shippingMethod: "express",
      shippingFee: 150_000,
    }),
  );
  const stored = await orders.findOneByOrFail({ id: created.id });
  assert.equal(stored.shippingMethod, "express");
  assert.equal(stored.shippingFee, 150_000);
});

test("down() removes both shipping columns", async () => {
  const migration = new AddOrderShipping1794100000000();
  const runner = dataSource.createQueryRunner();
  try {
    await runner.connect();
    await migration.down(runner);
  } finally {
    await runner.release();
  }

  const columns: Array<{ column_name: string }> = await dataSource.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'Order' AND column_name IN ('shippingMethod', 'shippingFee')`,
  );
  assert.equal(columns.length, 0);
});
