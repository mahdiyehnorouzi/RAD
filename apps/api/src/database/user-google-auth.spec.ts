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
import { AddUserGoogleAuth1793800000000 } from "./migrations/1793800000000-AddUserGoogleAuth";

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
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-google-auth-mig-"));
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

test("up() adds a nullable, unique googleId and makes passwordHash nullable", async () => {
  const migration = new AddUserGoogleAuth1793800000000();
  const runner = dataSource.createQueryRunner();
  try {
    await runner.connect();
    // `synchronize: true` already created the full current schema with
    // googleId absent and passwordHash NOT NULL — undo just enough of
    // that to exercise the migration's own up() against a pre-migration
    // shape, same approach as the sibling AddUserContactPhone spec.
    await runner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "googleId"`);
    await runner.query(
      `ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL`,
    );
    await migration.up(runner);
  } finally {
    await runner.release();
  }

  const users = dataSource.getRepository(User);
  const googleOnly = await users.save(
    users.create({
      name: "Google Buyer",
      email: "google-buyer@example.com",
      passwordHash: null,
      googleId: "google-sub-1",
    }),
  );
  const passwordAccount = await users.save(
    users.create({
      name: "Regular Buyer",
      email: "regular@example.com",
      passwordHash: "hashed",
      googleId: null,
    }),
  );

  const reloaded = await users.findOneByOrFail({ id: googleOnly.id });
  assert.equal(reloaded.passwordHash, null);
  assert.equal(reloaded.googleId, "google-sub-1");

  // Many-nulls-allowed: a second password-based (non-Google) account can
  // also have a null googleId without violating the unique constraint.
  const secondPasswordAccount = await users.save(
    users.create({
      name: "Another Buyer",
      email: "another@example.com",
      passwordHash: "hashed-2",
      googleId: null,
    }),
  );
  assert.ok(secondPasswordAccount.id !== passwordAccount.id);

  // The unique constraint still rejects two accounts sharing one googleId.
  await assert.rejects(
    () =>
      users.save(
        users.create({
          name: "Duplicate Google Buyer",
          email: "duplicate@example.com",
          passwordHash: null,
          googleId: "google-sub-1",
        }),
      ),
    (error: unknown) => error instanceof QueryFailedError,
  );
});

test("down() restores NOT NULL on passwordHash and drops googleId", async () => {
  const migration = new AddUserGoogleAuth1793800000000();
  const runner = dataSource.createQueryRunner();
  try {
    await runner.connect();
    // Clear the Google-only row created in the previous test — down()
    // requires every row to already have a non-null passwordHash.
    await runner.query(`DELETE FROM "User" WHERE "passwordHash" IS NULL`);
    await migration.down(runner);
  } finally {
    await runner.release();
  }

  const columns = await dataSource.query(
    `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'User'`,
  );
  const byName = new Map(
    columns.map((row: { column_name: string; is_nullable: string }) => [
      row.column_name,
      row.is_nullable,
    ]),
  );
  assert.equal(byName.has("googleId"), false);
  assert.equal(byName.get("passwordHash"), "NO");

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
