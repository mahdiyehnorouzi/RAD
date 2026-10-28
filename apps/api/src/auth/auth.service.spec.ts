import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { UnauthorizedException } from "@nestjs/common";
import { hash } from "bcryptjs";
import { AuthService } from "./auth.service";
import type { Actor } from "../common/identity";
import type { User } from "../database/entities";

/**
 * Unit coverage (no DB) for the null-passwordHash guard in `signIn` and
 * `changePassword`. The `User` entity types `passwordHash` as
 * `string | null` even though no migration here makes the column
 * nullable - a password-less (Google-only) account only exists once the
 * Google Sign-In migration has run, but this fix must ship to `main`
 * *before* that feature so it's already present on the artifact a
 * rollback could land on. See the comment on `User.passwordHash`.
 */
function usersRepoReturning(user: Record<string, unknown> | null) {
  return { findOne: async () => user, update: async () => ({}) } as never;
}

function noopRepo() {
  return {
    find: async () => [],
    update: async () => ({}),
    delete: async () => ({}),
    save: async () => ({}),
    create: (v: unknown) => v,
  } as never;
}

function authServiceWithUsers(usersRepo: unknown) {
  const jwt = { signAsync: async () => "token" } as never;
  const mail = {} as never;
  const inventory = { transferHolds: async () => {} } as never;
  return new AuthService(
    usersRepo as never,
    noopRepo(),
    noopRepo(),
    noopRepo(),
    noopRepo(),
    noopRepo(),
    noopRepo(),
    jwt,
    mail,
    inventory,
  );
}

/** An in-memory `Repository<User>` stand-in: enough for find/save/create. */
function fakeUsersStore(seed: Partial<User>[] = []) {
  const rows: Partial<User>[] = [...seed];
  let nextId = rows.length + 1;
  const repo = {
    findOne: async ({ where }: { where: Record<string, unknown> }) =>
      rows.find((row) =>
        Object.entries(where).every(([key, value]) => row[key as keyof User] === value),
      ) ?? null,
    create: (input: Partial<User>) => input,
    save: async (input: Partial<User>) => {
      const row = { id: `generated-${nextId++}`, ...input };
      rows.push(row);
      return row;
    },
  };
  return { repo: repo as never, rows };
}

const actor: Actor = { user: null, guestId: "guest-1" };

describe("AuthService.signIn", () => {
  test("correct password on a password-based account succeeds", async () => {
    const passwordHash = await hash("correct-password", 12);
    const auth = authServiceWithUsers(
      usersRepoReturning({
        id: "u1",
        name: "Buyer",
        email: "buyer@example.com",
        passwordHash,
        role: "customer",
        adminRole: null,
        status: "active",
      }),
    );
    const result = await auth.signIn(
      { email: "buyer@example.com", password: "correct-password" },
      actor,
    );
    assert.equal(result.user.email, "buyer@example.com");
    assert.equal(typeof result.sessionToken, "string");
  });

  test("wrong password on a password-based account is rejected as bad_credentials", async () => {
    const passwordHash = await hash("correct-password", 12);
    const auth = authServiceWithUsers(
      usersRepoReturning({
        id: "u1",
        name: "Buyer",
        email: "buyer@example.com",
        passwordHash,
        role: "customer",
        adminRole: null,
        status: "active",
      }),
    );
    await assert.rejects(
      auth.signIn(
        { email: "buyer@example.com", password: "wrong-password" },
        actor,
      ),
      (error: unknown) => {
        assert.ok(error instanceof UnauthorizedException);
        const response = error.getResponse() as { code?: string };
        assert.equal(response.code, "bad_credentials");
        return true;
      },
    );
  });

  test("a Google-only account (null passwordHash) is rejected with the same bad_credentials shape, not a throw/500", async () => {
    const auth = authServiceWithUsers(
      usersRepoReturning({
        id: "u2",
        name: "Google User",
        email: "google-user@example.com",
        passwordHash: null,
        role: "customer",
        adminRole: null,
        status: "active",
      }),
    );
    await assert.rejects(
      auth.signIn(
        { email: "google-user@example.com", password: "anything" },
        actor,
      ),
      (error: unknown) => {
        assert.ok(error instanceof UnauthorizedException);
        const response = error.getResponse() as {
          code?: string;
          message?: string;
        };
        // Same code/message as a plain wrong password - a caller must not
        // be able to tell a Google-only account apart from a wrong
        // password on an unregistered or password-based account.
        assert.equal(response.code, "bad_credentials");
        assert.equal(response.message, "ایمیل یا رمز عبور نادرست است.");
        return true;
      },
    );
  });

  test("nonexistent account is rejected with account_missing (unchanged enumeration shape)", async () => {
    const auth = authServiceWithUsers(usersRepoReturning(null));
    await assert.rejects(
      auth.signIn({ email: "nobody@example.com", password: "anything" }, actor),
      (error: unknown) => {
        assert.ok(error instanceof UnauthorizedException);
        const response = error.getResponse() as { code?: string };
        assert.equal(response.code, "account_missing");
        return true;
      },
    );
  });
});

describe("AuthService.changePassword", () => {
  function authedActor(userId: string): Actor {
    return {
      user: {
        id: userId,
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
        adminRole: "owner",
      },
      guestId: "guest-2",
    };
  }

  test("correct current password succeeds", async () => {
    const passwordHash = await hash("current-pass", 12);
    const auth = authServiceWithUsers(
      usersRepoReturning({
        id: "a1",
        adminRole: "owner",
        passwordHash,
      }),
    );
    const result = await auth.changePassword(authedActor("a1"), {
      currentPassword: "current-pass",
      newPassword: "new-pass-123",
    });
    assert.deepEqual(result, { ok: true });
  });

  test("wrong current password is rejected", async () => {
    const passwordHash = await hash("current-pass", 12);
    const auth = authServiceWithUsers(
      usersRepoReturning({
        id: "a1",
        adminRole: "owner",
        passwordHash,
      }),
    );
    await assert.rejects(
      auth.changePassword(authedActor("a1"), {
        currentPassword: "wrong-pass",
        newPassword: "new-pass-123",
      }),
      UnauthorizedException,
    );
  });

  test("a password-less admin-role account (null passwordHash) is rejected, not thrown as a 500", async () => {
    const auth = authServiceWithUsers(
      usersRepoReturning({
        id: "a1",
        adminRole: "owner",
        passwordHash: null,
      }),
    );
    await assert.rejects(
      auth.changePassword(authedActor("a1"), {
        currentPassword: "anything",
        newPassword: "new-pass-123",
      }),
      UnauthorizedException,
    );
  });
});

describe("AuthService.signInWithPhone", () => {
  const guest: Actor = { user: null, guestId: "guest-otp" };

  test("a first-time phone creates a brand-new, password-less, email-less account", async () => {
    const { repo, rows } = fakeUsersStore();
    const auth = authServiceWithUsers(repo);
    const result = await auth.signInWithPhone("09121234567", guest);

    assert.equal(rows.length, 1);
    assert.equal(rows[0].phone, "09121234567");
    assert.equal(rows[0].email, null);
    assert.ok(rows[0].passwordHash, "a random unusable hash must still be set");
    assert.equal(result.user.email, null);
    assert.equal(typeof result.sessionToken, "string");
  });

  test("a returning phone signs into the same account, not a new one", async () => {
    const { repo, rows } = fakeUsersStore([
      {
        id: "existing-otp-user",
        name: "مشتری رَد",
        email: null,
        phone: "09127654321",
        passwordHash: "unusable",
        role: "customer",
        adminRole: null,
        status: "active",
      },
    ]);
    const auth = authServiceWithUsers(repo);
    const result = await auth.signInWithPhone("09127654321", guest);

    assert.equal(rows.length, 1, "no second account was created");
    assert.equal(result.user.id, "existing-otp-user");
  });

  test("never auto-links to an existing email/password account merely by chance — only an exact stored phone match signs in", async () => {
    const { repo, rows } = fakeUsersStore([
      {
        id: "email-password-user",
        name: "Buyer",
        email: "buyer@example.com",
        phone: null,
        passwordHash: await hash("some-password", 12),
        role: "customer",
        adminRole: null,
        status: "active",
      },
    ]);
    const auth = authServiceWithUsers(repo);
    const result = await auth.signInWithPhone("09121112222", guest);

    // A brand-new account was created for this phone — the existing
    // email/password account (which has no phone on file) was never
    // touched or signed into.
    assert.equal(rows.length, 2);
    assert.notEqual(result.user.id, "email-password-user");
  });

  test("an invited (not-yet-active) account found by phone is rejected, not silently signed in", async () => {
    const { repo } = fakeUsersStore([
      {
        id: "invited-user",
        name: "Invited",
        email: null,
        phone: "09123334444",
        passwordHash: "unusable",
        role: "customer",
        adminRole: null,
        status: "invited",
      },
    ]);
    const auth = authServiceWithUsers(repo);
    await assert.rejects(
      auth.signInWithPhone("09123334444", guest),
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
});
