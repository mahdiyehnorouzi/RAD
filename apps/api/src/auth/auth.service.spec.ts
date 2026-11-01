import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import { AuthService } from "./auth.service";
import type { Actor } from "../common/identity";

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
  return {
    findOne: async () => user,
    update: async () => ({}),
    manager: {
      transaction: async (
        work: (manager: {
          update: () => Promise<void>;
          delete: () => Promise<void>;
        }) => Promise<void>,
      ) => {
        await work({
          update: async () => {},
          delete: async () => {},
        });
      },
    },
  } as never;
}

/**
 * Models TypeORM's `manager.transaction`: writes land only if the callback
 * resolves. A throw rolls the staged hash and token deletion back.
 */
function passwordChangeRepo(
  user: Record<string, unknown> | null,
  options?: { failUpdate?: boolean; failDelete?: boolean },
) {
  const committed: { passwordHash?: string; deleted: unknown[] } = {
    deleted: [],
  };
  let transactions = 0;
  let outsideWrites = 0;
  const repo = {
    findOne: async () => user,
    update: async () => {
      outsideWrites += 1;
    },
    manager: {
      transaction: async (
        work: (manager: {
          update: (
            entity: unknown,
            where: unknown,
            patch: { passwordHash?: string },
          ) => Promise<void>;
          delete: (entity: unknown, where: unknown) => Promise<void>;
        }) => Promise<void>,
      ) => {
        transactions += 1;
        const staged: { passwordHash?: string; deleted: unknown[] } = {
          deleted: [],
        };
        await work({
          update: async (_entity, _where, patch) => {
            if (options?.failUpdate) throw new Error("password update failed");
            staged.passwordHash = patch.passwordHash;
          },
          delete: async (_entity, where) => {
            if (options?.failDelete)
              throw new Error("reset token delete failed");
            staged.deleted.push(where);
          },
        });
        committed.passwordHash = staged.passwordHash;
        committed.deleted = staged.deleted;
      },
    },
  };
  return {
    repo: repo as never,
    committed,
    transactions: () => transactions,
    outsideWrites: () => outsideWrites,
  };
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
        phone: null,
        role: "admin",
        adminRole: "owner",
      },
      guestId: "guest-2",
    };
  }

  test("a staff password change commits the hash and clears reset tokens together", async () => {
    const passwordHash = await hash("current-pass", 12);
    const store = passwordChangeRepo({
      id: "a1",
      adminRole: "owner",
      status: "active",
      passwordHash,
    });
    const auth = authServiceWithUsers(store.repo);
    const result = await auth.changePassword(authedActor("a1"), {
      currentPassword: "current-pass",
      newPassword: "new-pass-123",
    });
    assert.deepEqual(result, { ok: true });
    assert.equal(store.transactions(), 1);
    assert.equal(store.outsideWrites(), 0);
    assert.equal(
      await compare("new-pass-123", store.committed.passwordHash!),
      true,
    );
    assert.deepEqual(store.committed.deleted, [{ userId: "a1" }]);
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

  test("a password-less account (null passwordHash) is rejected, not thrown as a 500", async () => {
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
      (error: unknown) => {
        assert.ok(error instanceof UnauthorizedException);
        const response = error.getResponse() as { code?: string };
        assert.equal(response.code, "password_unset");
        return true;
      },
    );
  });

  test("a customer password account can change its own password without a new session", async () => {
    const passwordHash = await hash("current-pass", 12);
    const store = passwordChangeRepo({
      id: "c1",
      adminRole: null,
      status: "active",
      passwordHash,
    });
    let signed = false;
    const auth = new AuthService(
      store.repo,
      noopRepo(),
      noopRepo(),
      noopRepo(),
      noopRepo(),
      noopRepo(),
      noopRepo(),
      {
        signAsync: async () => {
          signed = true;
          return "token";
        },
      } as never,
      {} as never,
      { transferHolds: async () => {} } as never,
    );
    const result = await auth.changePassword(
      {
        user: {
          id: "c1",
          name: "Buyer",
          email: "buyer@example.com",
          phone: null,
          role: "customer",
          adminRole: null,
        },
        guestId: "guest-3",
      },
      { currentPassword: "current-pass", newPassword: "new-pass-123" },
    );
    assert.deepEqual(result, { ok: true });
    assert.equal(signed, false);
    assert.equal(store.transactions(), 1);
    assert.equal(store.outsideWrites(), 0);
    const stored = store.committed.passwordHash!;
    assert.notEqual(stored, "new-pass-123");
    assert.equal(await compare("new-pass-123", stored), true);
    assert.equal(await compare("current-pass", stored), false);
    assert.deepEqual(store.committed.deleted, [{ userId: "c1" }]);
  });

  test("a reset-token deletion failure rolls the new password hash back", async () => {
    const passwordHash = await hash("current-pass", 12);
    const store = passwordChangeRepo(
      {
        id: "c1",
        status: "active",
        passwordHash,
      },
      { failDelete: true },
    );
    const auth = authServiceWithUsers(store.repo);
    await assert.rejects(
      auth.changePassword(authedActor("c1"), {
        currentPassword: "current-pass",
        newPassword: "new-pass-123",
      }),
      /reset token delete failed/,
    );
    assert.equal(store.transactions(), 1);
    assert.equal(store.committed.passwordHash, undefined);
    assert.deepEqual(store.committed.deleted, []);
    assert.equal(store.outsideWrites(), 0);
  });

  test("a password-hash write failure does not clear reset tokens", async () => {
    const passwordHash = await hash("current-pass", 12);
    const store = passwordChangeRepo(
      {
        id: "c1",
        status: "active",
        passwordHash,
      },
      { failUpdate: true },
    );
    const auth = authServiceWithUsers(store.repo);
    await assert.rejects(
      auth.changePassword(authedActor("c1"), {
        currentPassword: "current-pass",
        newPassword: "new-pass-123",
      }),
      /password update failed/,
    );
    assert.equal(store.committed.passwordHash, undefined);
    assert.deepEqual(store.committed.deleted, []);
    assert.equal(store.outsideWrites(), 0);
  });

  test("an unauthenticated request is rejected", async () => {
    const auth = authServiceWithUsers(usersRepoReturning(null));
    await assert.rejects(
      auth.changePassword(
        { user: null, guestId: "guest-4" },
        { currentPassword: "current-pass", newPassword: "new-pass-123" },
      ),
      (error: unknown) => {
        assert.ok(error instanceof UnauthorizedException);
        const response = error.getResponse() as { code?: string };
        assert.equal(response.code, "unauthenticated");
        return true;
      },
    );
  });

  test("the wrong current password is rejected before the new password is stored", async () => {
    const passwordHash = await hash("current-pass", 12);
    let updated = false;
    const auth = authServiceWithUsers({
      findOne: async () => ({
        id: "c1",
        status: "active",
        passwordHash,
      }),
      update: async () => {
        updated = true;
      },
    });
    await assert.rejects(
      auth.changePassword(
        {
          user: {
            id: "c1",
            name: "Buyer",
            email: "buyer@example.com",
            phone: null,
            role: "customer",
            adminRole: null,
          },
          guestId: "guest-3",
        },
        { currentPassword: "wrong-pass", newPassword: "short" },
      ),
      (error: unknown) => {
        assert.ok(error instanceof UnauthorizedException);
        const response = error.getResponse() as {
          code?: string;
          message?: string;
        };
        assert.equal(response.code, "password_incorrect");
        assert.equal(response.message, "رمز عبور فعلی نادرست است.");
        assert.equal(updated, false);
        return true;
      },
    );
  });

  test("a new password shorter than the policy is rejected", async () => {
    const passwordHash = await hash("current-pass", 12);
    const auth = authServiceWithUsers(
      usersRepoReturning({
        id: "c1",
        status: "active",
        passwordHash,
      }),
    );
    await assert.rejects(
      auth.changePassword(
        {
          user: {
            id: "c1",
            name: "Buyer",
            email: "buyer@example.com",
            phone: null,
            role: "customer",
            adminRole: null,
          },
          guestId: "guest-3",
        },
        { currentPassword: "current-pass", newPassword: "short" },
      ),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        const response = error.getResponse() as { code?: string };
        assert.equal(response.code, "password_invalid");
        return true;
      },
    );
  });

  test("reusing the current password is rejected", async () => {
    const passwordHash = await hash("current-pass", 12);
    const auth = authServiceWithUsers(
      usersRepoReturning({
        id: "c1",
        status: "active",
        passwordHash,
      }),
    );
    await assert.rejects(
      auth.changePassword(authedActor("c1"), {
        currentPassword: "current-pass",
        newPassword: "current-pass",
      }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        const response = error.getResponse() as { code?: string };
        assert.equal(response.code, "password_reused");
        return true;
      },
    );
  });
});
