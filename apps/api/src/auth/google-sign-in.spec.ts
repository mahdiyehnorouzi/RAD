import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../database/data-source";
import {
  CartItem,
  Commission,
  Favorite,
  Notice,
  Order,
  PasswordResetToken,
  User,
} from "../database/entities";
import { AuthService } from "./auth.service";
import { InventoryService } from "../inventory/inventory.service";
import { MailService } from "../mail/mail.service";

/**
 * DB-backed coverage for `AuthService.signInWithGoogle` — the part of
 * Google Sign-In (#18 in the recovery backlog) that is safe to unit-test
 * without live Google infra: given an already-verified profile (what
 * `GoogleStrategy`/`google-auth-library` hands over after the real OAuth
 * exchange + ID-token verification), does account matching/creation/linking
 * do the right thing. Proves:
 * - a brand-new verified email creates a password-less account;
 * - an unverified email is refused outright, never matched or created;
 * - a second sign-in with the same googleId reuses the same account, not a
 *   duplicate;
 * - a verified email matching an EXISTING (password-based) account links
 *   it by googleId rather than creating a second identity — Google has
 *   already proven ownership of that email, so this is the standard
 *   "sign in with Google using an email you already have an account for"
 *   behavior, not an accidental takeover (no password is read or changed).
 *
 * Requires embedded-postgres (same environment caveat as
 * `admin/invite-member.spec.ts`).
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
let auth: AuthService;

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-google-auth-"));
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

  const repo = dataSource.getRepository.bind(dataSource);
  const inventory = new InventoryService(dataSource);
  auth = new AuthService(
    repo(User),
    repo(Notice),
    repo(PasswordResetToken),
    repo(CartItem),
    repo(Favorite),
    repo(Order),
    repo(Commission),
    { signAsync: async () => "fake-jwt" } as never,
    new MailService(new ConfigService({})),
    inventory,
  );
});

after(async () => {
  await dataSource?.destroy();
  await pg?.stop();
  if (databaseDir) rmSync(databaseDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await dataSource.getRepository(PasswordResetToken).clear();
  await dataSource.getRepository(User).clear({ cascade: true });
});

const guestActor = (guestId = "guest-1") => ({ user: null, guestId });

test("a new verified Google profile creates a password-less account", async () => {
  const { user } = await auth.signInWithGoogle(
    {
      googleId: "google-sub-1",
      email: "new@example.com",
      emailVerified: true,
      name: "New Buyer",
    },
    guestActor(),
  );
  assert.equal(user.email, "new@example.com");
  const row = await dataSource
    .getRepository(User)
    .findOneOrFail({ where: { email: "new@example.com" } });
  assert.equal(row.googleId, "google-sub-1");
  assert.equal(row.passwordHash, null);
});

test("an unverified email is refused, never matched or created", async () => {
  await assert.rejects(
    () =>
      auth.signInWithGoogle(
        {
          googleId: "google-sub-2",
          email: "unverified@example.com",
          emailVerified: false,
          name: "Nobody",
        },
        guestActor(),
      ),
    UnauthorizedException,
  );
  const row = await dataSource
    .getRepository(User)
    .findOne({ where: { email: "unverified@example.com" } });
  assert.equal(row, null);
});

test("a repeat sign-in with the same googleId reuses the same account", async () => {
  const first = await auth.signInWithGoogle(
    {
      googleId: "google-sub-3",
      email: "repeat@example.com",
      emailVerified: true,
      name: "Repeat Buyer",
    },
    guestActor("guest-a"),
  );
  const second = await auth.signInWithGoogle(
    {
      googleId: "google-sub-3",
      email: "repeat@example.com",
      emailVerified: true,
      name: "Repeat Buyer",
    },
    guestActor("guest-b"),
  );
  assert.equal(first.user.id, second.user.id);
  const count = await dataSource
    .getRepository(User)
    .count({ where: { email: "repeat@example.com" } });
  assert.equal(count, 1);
});

test("a verified email matching an existing password account links it instead of duplicating", async () => {
  const existing = await dataSource.getRepository(User).save(
    dataSource.getRepository(User).create({
      name: "Existing Buyer",
      email: "existing@example.com",
      passwordHash: "not-touched-hash",
      role: "customer",
      status: "active",
    }),
  );

  const { user } = await auth.signInWithGoogle(
    {
      googleId: "google-sub-4",
      email: "existing@example.com",
      emailVerified: true,
      name: "Existing Buyer",
    },
    guestActor(),
  );

  assert.equal(user.id, existing.id);
  const row = await dataSource
    .getRepository(User)
    .findOneOrFail({ where: { id: existing.id } });
  assert.equal(row.googleId, "google-sub-4");
  // Linking never touches the existing password.
  assert.equal(row.passwordHash, "not-touched-hash");
  const count = await dataSource
    .getRepository(User)
    .count({ where: { email: "existing@example.com" } });
  assert.equal(count, 1);
});
