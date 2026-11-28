import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import { type DataSource } from "typeorm";
import { createAppDataSource } from "./data-source";
import { Notice } from "./entities";
import { AddNoticeMessageId1794400000000 } from "./migrations/1794400000000-AddNoticeMessageId";

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
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-notice-message-id-"));
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

test("up() adds a nullable messageId column; a pre-existing row reads it as null", async () => {
  const notices = dataSource.getRepository(Notice);
  // `synchronize: true` already created `messageId` (it's on the entity),
  // so insert a notice through the live schema first, then drop the
  // column to simulate the real pre-migration shape, same approach as
  // the sibling AddOrderMessage/AddUserGoogleAuth specs.
  const existing = await notices.save(
    notices.create({
      ownerKey: "owner-existing",
      kind: "commission_message",
      productSlug: "RAD-M-1",
    }),
  );

  const migration = new AddNoticeMessageId1794400000000();
  const runner = dataSource.createQueryRunner();
  try {
    await runner.connect();
    await runner.query(`ALTER TABLE "Notice" DROP COLUMN "messageId"`);
    await migration.up(runner);
  } finally {
    await runner.release();
  }

  const reloadedExisting = await notices.findOneByOrFail({ id: existing.id });
  assert.equal(
    reloadedExisting.messageId,
    null,
    "a row written before the column existed reads back as null, not an error",
  );

  const created = await notices.save(
    notices.create({
      ownerKey: "owner-new",
      kind: "commission_message",
      productSlug: "RAD-M-2",
      messageId: "m-abc123",
    }),
  );
  const reloadedCreated = await notices.findOneByOrFail({ id: created.id });
  assert.equal(reloadedCreated.messageId, "m-abc123");
});

test("down() drops the messageId column", async () => {
  const migration = new AddNoticeMessageId1794400000000();
  const runner = dataSource.createQueryRunner();
  try {
    await runner.connect();
    await migration.down(runner);
  } finally {
    await runner.release();
  }

  const columns: Array<{ column_name: string }> = await dataSource.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'Notice' AND column_name = 'messageId'`,
  );
  assert.equal(columns.length, 0, "down() must remove the messageId column");

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
