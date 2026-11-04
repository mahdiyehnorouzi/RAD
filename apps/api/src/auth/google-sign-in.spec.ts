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
 * Google Sign-In that is safe to unit-test without live Google infra:
 * given an already-verified profile (what `GoogleAuthService` hands over
 * after the real OAuth exchange + ID-token verification), does account
 * matching/creation/linking do the right thing. Proves:
 * - a brand-new verified email creates a password-less account;
 * - an unverified email is refused outright, never matched or created;
 * - a second sign-in with the same googleId reuses the same account, not a
 *   duplicate;
 * - a verified email matching an EXISTING (password-based) account links
 *   it by googleId rather than creating a second identity — Google has
 *   already proven ownership of that email, so this is the standard
 *   "sign in with Google using an email you already have an account for"
 *   behavior, not an accidental takeover (no password is read or changed);
 * - an invited (not-yet-active) account is refused, same as password and
 *   OTP sign-in.
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

test("an invited (not yet active) account cannot sign in via Google", async () => {
  await dataSource.getRepository(User).save(
    dataSource.getRepository(User).create({
      name: "Invited Staff",
      email: "invited@example.com",
      passwordHash: "not-touched-hash",
      role: "customer",
      status: "invited",
    }),
  );

  await assert.rejects(
    () =>
      auth.signInWithGoogle(
        {
          googleId: "google-sub-5",
          email: "invited@example.com",
          emailVerified: true,
          name: "Invited Staff",
        },
        guestActor(),
      ),
    (error: unknown) => {
      assert.ok(error instanceof UnauthorizedException);
      assert.equal(
        (error.getResponse() as { code?: string }).code,
        "account_inactive",
      );
      return true;
    },
  );
});

/**
 * Hardening pass: account-linking security/correctness regression tests
 * (see the task that added them for the full scenario list). These cover
 * what the happy-path tests above don't — an existing account already
 * linked to a *different* Google identity, linking never mutating an
 * invited account, preserved fields on link, and the same-googleId
 * concurrency case the advisory lock in `signInWithGoogle` exists for.
 */

test("an email already linked to a DIFFERENT Google identity is refused, never silently re-linked", async () => {
  const existing = await dataSource.getRepository(User).save(
    dataSource.getRepository(User).create({
      name: "Already Linked",
      email: "already-linked@example.com",
      passwordHash: null,
      googleId: "google-sub-original",
      role: "customer",
      status: "active",
    }),
  );

  await assert.rejects(
    () =>
      auth.signInWithGoogle(
        {
          googleId: "google-sub-attacker",
          email: "already-linked@example.com",
          emailVerified: true,
          name: "Already Linked",
        },
        guestActor(),
      ),
    (error: unknown) => {
      assert.ok(error instanceof UnauthorizedException);
      assert.equal(
        (error.getResponse() as { code?: string }).code,
        "google_account_mismatch",
      );
      return true;
    },
  );

  // No mutation: the original googleId is untouched and no second account
  // was created for this email.
  const row = await dataSource
    .getRepository(User)
    .findOneOrFail({ where: { id: existing.id } });
  assert.equal(row.googleId, "google-sub-original");
  const count = await dataSource
    .getRepository(User)
    .count({ where: { email: "already-linked@example.com" } });
  assert.equal(count, 1);
});

test("re-signing in with the SAME already-linked googleId is still allowed (not a mismatch)", async () => {
  const existing = await dataSource.getRepository(User).save(
    dataSource.getRepository(User).create({
      name: "Already Linked",
      email: "same-identity@example.com",
      passwordHash: null,
      googleId: "google-sub-same",
      role: "customer",
      status: "active",
    }),
  );

  const { user } = await auth.signInWithGoogle(
    {
      googleId: "google-sub-same",
      email: "same-identity@example.com",
      emailVerified: true,
      name: "Already Linked",
    },
    guestActor(),
  );
  assert.equal(user.id, existing.id);
});

test("linking an invited account is refused before any mutation — googleId stays unset", async () => {
  const invited = await dataSource.getRepository(User).save(
    dataSource.getRepository(User).create({
      name: "Invited Buyer",
      email: "invited-link@example.com",
      passwordHash: "not-touched-hash",
      role: "customer",
      status: "invited",
    }),
  );

  await assert.rejects(
    () =>
      auth.signInWithGoogle(
        {
          googleId: "google-sub-invited",
          email: "invited-link@example.com",
          emailVerified: true,
          name: "Invited Buyer",
        },
        guestActor(),
      ),
    (error: unknown) => {
      assert.ok(error instanceof UnauthorizedException);
      assert.equal(
        (error.getResponse() as { code?: string }).code,
        "account_inactive",
      );
      return true;
    },
  );

  const row = await dataSource
    .getRepository(User)
    .findOneOrFail({ where: { id: invited.id } });
  assert.equal(row.googleId, null);
  assert.equal(row.passwordHash, "not-touched-hash");
});

test("linking preserves the existing password hash and verified phone, touching only googleId", async () => {
  const existing = await dataSource.getRepository(User).save(
    dataSource.getRepository(User).create({
      name: "Phone And Password",
      email: "phone-and-password@example.com",
      passwordHash: "existing-hash",
      verifiedPhone: "09121234567",
      role: "customer",
      status: "active",
    }),
  );

  await auth.signInWithGoogle(
    {
      googleId: "google-sub-preserve",
      email: "phone-and-password@example.com",
      emailVerified: true,
      name: "Phone And Password",
    },
    guestActor(),
  );

  const row = await dataSource
    .getRepository(User)
    .findOneOrFail({ where: { id: existing.id } });
  assert.equal(row.passwordHash, "existing-hash");
  assert.equal(row.verifiedPhone, "09121234567");
  assert.equal(row.googleId, "google-sub-preserve");
});

test("two concurrent sign-ins with the same new googleId create exactly one account, not a duplicate or a crash", async () => {
  const profile = {
    googleId: "google-sub-concurrent",
    email: "concurrent@example.com",
    emailVerified: true,
    name: "Concurrent Buyer",
  };

  const [first, second] = await Promise.all([
    auth.signInWithGoogle(profile, guestActor("guest-x")),
    auth.signInWithGoogle(profile, guestActor("guest-y")),
  ]);

  assert.equal(first.user.id, second.user.id);
  const count = await dataSource
    .getRepository(User)
    .count({ where: { email: "concurrent@example.com" } });
  assert.equal(count, 1);
});
