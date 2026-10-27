import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { adminOrderRelations } from "../admin/const/order-relations";
import { createAppDataSource } from "./data-source";
import { Order } from "./entities";
import { AddPaymentIntentGatewayColumns1793032301266 } from "./migrations/1793032301266-AddPaymentIntentGatewayColumns";

/**
 * Regression test for the P0 production incident: the ZarinPal backend
 * commit added `gatewayAuthority`/`gatewayRefId`/`verifiedAt` to the
 * `PaymentIntent` entity, but no migration ever shipped those columns, so
 * production's real database never had them. Any query touching
 * `PaymentIntent` (including `AdminService.listOrders()`, which is what
 * backed GET /admin/orders) 500'd as soon as the entity gained those
 * fields. This exercises the real migration file end to end — not a
 * hand-copied SQL string — against a throwaway, fully-synchronized
 * database: drop exactly what the migration adds, confirm the query fails
 * the same way production did, then run the migration's own `up()` and
 * confirm it's fixed.
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

let pg: EmbeddedPostgres;
let databaseDir: string;
let dataSource: DataSource;

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-schema-regress-"));
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

function listOrdersQuery() {
  return dataSource
    .getRepository(Order)
    .find({ relations: adminOrderRelations, order: { createdAt: "DESC" } });
}

test("missing PaymentIntent gateway columns reproduce the admin/orders 500, and the migration fixes it", async () => {
  const migration = new AddPaymentIntentGatewayColumns1793032301266();
  const runner = dataSource.createQueryRunner();
  await runner.connect();

  try {
    // Simulate production's pre-fix schema by reverting the migration this
    // incident produced.
    await migration.down(runner);

    await assert.rejects(listOrdersQuery(), (error: Error) => {
      assert.match(error.message, /gatewayAuthority/);
      return true;
    });

    // The actual fix: run the migration's own up().
    await migration.up(runner);

    const orders = await listOrdersQuery();
    assert.deepEqual(orders, []);
  } finally {
    await runner.release();
  }
});
