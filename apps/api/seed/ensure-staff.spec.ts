import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";
import { compare } from "bcryptjs";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../src/database/data-source";
import { User } from "../src/database/entities";
import { ensureStaff } from "./ensure-staff";

/**
 * DB-backed regression coverage for the incident: `ensureStaff` ran on
 * every production boot and unconditionally reset the owner/editor
 * password hash to `ADMIN_PASSWORD`/`EDITOR_PASSWORD`, so any password
 * changed through the app (or via a one-time recovery) was silently
 * reverted on the next restart/deploy. These tests prove the fixed
 * behavior: the bootstrap password only applies on first creation, an
 * existing account's password survives repeated `ensureStaff` runs, and
 * non-security fields still upsert every boot.
 *
 * Requires embedded-postgres to actually start a local Postgres server;
 * like `admin/replace-images.spec.ts`, this does not run in sandboxes that
 * block the required OS syscalls, but runs as written in a normal/CI
 * environment.
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

let databaseDir: string;
let pg: EmbeddedPostgres;
let dataSource: DataSource;
let users: ReturnType<DataSource["getRepository"]>;

const ADMIN_EMAIL = "owner@rad.test";
const ORIGINAL_PASSWORD = "original-bootstrap-password";
const CHANGED_PASSWORD = "admin-changed-this-themselves";

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-ensure-staff-"));
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
  users = dataSource.getRepository(User);
});

after(async () => {
  await dataSource?.destroy();
  await pg?.stop();
  if (databaseDir) rmSync(databaseDir, { recursive: true, force: true });
});

beforeEach(async () => {
  // cascade: PasswordResetToken FKs to users, so a plain TRUNCATE is
  // refused by Postgres once that table exists in the synced schema.
  await users.clear({ cascade: true });
  process.env.ADMIN_EMAIL = ADMIN_EMAIL;
  process.env.ADMIN_PASSWORD = ORIGINAL_PASSWORD;
  delete process.env.EDITOR_EMAIL;
  delete process.env.EDITOR_PASSWORD;
  delete process.env.NODE_ENV;
});

describe("ensureStaff: first boot (account does not exist yet)", () => {
  test("creates the owner account with the bootstrap password", async () => {
    await ensureStaff(dataSource);
    const user = await users.findOneOrFail({ where: { email: ADMIN_EMAIL } });
    assert.equal(user.status, "active");
    assert.equal(user.adminRole, "owner");
    assert.equal(await compare(ORIGINAL_PASSWORD, user.passwordHash), true);
  });
});

describe("ensureStaff: password changes persist across restarts/deploys", () => {
  test("a password changed after creation is NOT reverted by a later ensureStaff run with the same env var", async () => {
    await ensureStaff(dataSource);
    const created = await users.findOneOrFail({
      where: { email: ADMIN_EMAIL },
    });

    // Simulate the admin changing their password through the app (or a
    // one-time recovery) — same effect as AuthService.changePassword.
    const { hash } = await import("bcryptjs");
    const newHash = await hash(CHANGED_PASSWORD, 12);
    await users.update({ id: created.id }, { passwordHash: newHash });

    // Simulate N more boots/restarts/deploys, all with the SAME
    // ADMIN_PASSWORD env var still set (the realistic production
    // scenario — the deploy pipeline doesn't rotate it per boot).
    await ensureStaff(dataSource);
    await ensureStaff(dataSource);
    await ensureStaff(dataSource);

    const after = await users.findOneOrFail({ where: { email: ADMIN_EMAIL } });
    assert.equal(
      await compare(CHANGED_PASSWORD, after.passwordHash),
      true,
      "the admin's changed password must survive repeated ensureStaff runs",
    );
    assert.equal(
      await compare(ORIGINAL_PASSWORD, after.passwordHash),
      false,
      "ensureStaff must not revert to the bootstrap password once the account exists",
    );
  });

  test("non-security fields (name/role/adminRole) still upsert on every boot", async () => {
    await ensureStaff(dataSource);
    const created = await users.findOneOrFail({
      where: { email: ADMIN_EMAIL },
    });
    await users.update(
      { id: created.id },
      { name: "Someone Else", adminRole: "editor" },
    );

    await ensureStaff(dataSource);

    const after = await users.findOneOrFail({ where: { email: ADMIN_EMAIL } });
    assert.equal(after.name, "مهدیه نوروزی");
    assert.equal(after.adminRole, "owner");
  });

  test("status is no longer force-reset to active every boot (an admin-set 'invited' status survives)", async () => {
    await ensureStaff(dataSource);
    const created = await users.findOneOrFail({
      where: { email: ADMIN_EMAIL },
    });
    await users.update({ id: created.id }, { status: "invited" });

    await ensureStaff(dataSource);

    const after = await users.findOneOrFail({ where: { email: ADMIN_EMAIL } });
    assert.equal(after.status, "invited");
  });
});

describe("ensureStaff: production dev-password lockout is unaffected by the fix", () => {
  test("a staff account still on the public dev-default password gets locked out in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.ADMIN_EMAIL = "mahdiyeh.norozi77@gmail.com";
    delete process.env.ADMIN_PASSWORD; // unset in prod: account is left untouched if it exists, but...
    // ...the account already exists with the known public dev password
    // (e.g. it was created before ADMIN_PASSWORD was ever set).
    const { hash } = await import("bcryptjs");
    await users.save(
      users.create({
        email: "mahdiyeh.norozi77@gmail.com",
        name: "مهدیه نوروزی",
        role: "admin",
        adminRole: "owner",
        status: "active",
        passwordHash: await hash("rad-studio-owner", 12),
      }),
    );

    await ensureStaff(dataSource);

    const after = await users.findOneOrFail({
      where: { email: "mahdiyeh.norozi77@gmail.com" },
    });
    assert.equal(
      await compare("rad-studio-owner", after.passwordHash),
      false,
      "the public dev password must still be locked out in production",
    );
  });
});

describe("ensureStaff: dev-password lockout tolerates a password-less (Google-only) staff row", () => {
  // Not DB-backed: the `User.passwordHash` column is NOT NULL today (no
  // migration here changes that), so embedded-postgres would reject this
  // insert. The scenario this guards is only reachable after the Google
  // Sign-In migration has run and this older artifact becomes a rollback
  // target - exercised here against the function directly with a stub
  // repo, the same way `auth.service.spec.ts` covers its guards.
  test("lockPublicPassword returns false instead of throwing when passwordHash is null", async () => {
    const { lockPublicPassword } = await import("./ensure-staff");
    const stubUsers = {
      findOne: async () => ({
        id: "staff-1",
        email: "mahdiyeh.norozi77@gmail.com",
        passwordHash: null,
      }),
      update: async () => ({}),
    } as never;
    const locked = await lockPublicPassword(
      stubUsers,
      "mahdiyeh.norozi77@gmail.com",
      "rad-studio-owner",
    );
    assert.equal(locked, false);
  });
});
