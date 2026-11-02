import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import { QueryFailedError, type DataSource } from "typeorm";
import { createAppDataSource } from "./data-source";
import { User } from "./entities";
import { AddUserContactPhone1793510000000 } from "./migrations/1793510000000-AddUserContactPhone";

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
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-user-phone-"));
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

test("User.phone migration adds a nullable unique contact number without touching email uniqueness", async () => {
  const migration = new AddUserContactPhone1793510000000();
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    await runner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "phone"`);
    await migration.up(runner);
  } finally {
    await runner.release();
  }

  const users = dataSource.getRepository(User);
  const first = await users.save(
    users.create({
      name: "سارا",
      email: "sara@example.com",
      passwordHash: "hashed",
      phone: "09121234567",
    }),
  );
  const second = await users.save(
    users.create({
      name: "نسترن",
      email: "nastaran@example.com",
      passwordHash: "hashed",
      phone: null,
    }),
  );
  await users.save(
    users.create({
      name: "لیلا",
      email: "leila@example.com",
      passwordHash: "hashed",
      phone: null,
    }),
  );

  await assert.rejects(
    () =>
      users.save(
        users.create({
          name: "دیگر",
          email: "sara@example.com",
          passwordHash: "hashed",
        }),
      ),
    (error: unknown) => error instanceof QueryFailedError,
  );

  await assert.rejects(
    () => users.update({ id: second.id }, { phone: first.phone }),
    (error: unknown) => error instanceof QueryFailedError,
  );

  const reloaded = await users.findOneByOrFail({ id: first.id });
  assert.equal(reloaded.phone, "09121234567");
  assert.equal(reloaded.email, "sara@example.com");
});
