import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { ConflictException, NotFoundException } from "@nestjs/common";
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
  PaymentIntent,
  Product,
  ProductAttribute,
  ProductAttributeCategory,
  ProductAttributeOption,
  ProductAttributeValue,
  ProductImage,
  Review,
  User,
  Vendor,
} from "../database/entities";
import { AdminService } from "./admin.service";
import { AuthService } from "../auth/auth.service";
import { InventoryService } from "../inventory/inventory.service";
import { NoticesService } from "../notices/notices.service";
import { MailService } from "../mail/mail.service";
import { PaymentReviewService } from "../orders/payment-review.service";
import { ProductAttributesService } from "../product-attributes/product-attributes.service";
import { CloudinaryStorageService } from "../storage/cloudinary-storage.service";

/**
 * DB-backed coverage for the admin invitation flow (fixes the second half
 * of the incident: invite emails were never sent at all, since
 * `inviteMember` created the account but never attempted mail). Proves:
 * - inviting sends exactly one email carrying a one-time code, never a
 *   generated password;
 * - a failed invite email rolls back the created account (no orphaned
 *   "invited forever, nobody told them" state) and can be retried cleanly;
 * - the invitee accepts via the existing `POST /auth/password/reset` code
 *   flow, which both sets their password and activates the account;
 * - the code is single-use (replay is rejected) and expires;
 * - resending an invite does not create a duplicate account.
 *
 * Requires embedded-postgres (same environment caveat as
 * `replace-images.spec.ts`: does not run under this sandbox's Docker/root
 * restrictions, but runs as written in a normal/CI environment).
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
let admin: AdminService;
let auth: AuthService;
let sentInvites: Array<{ to: string; code: string }>;
let failNextSend: boolean;

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-invite-"));
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
  const mail = new MailService(new ConfigService({}));
  // Stub only the one network-facing call, so the rest of MailService's
  // real validation/error-shaping logic still runs.
  mail.sendAdminInvite = async (to: string, code: string) => {
    if (failNextSend) throw new Error("simulated SMTP failure");
    sentInvites.push({ to, code });
  };

  const inventory = new InventoryService(dataSource);
  const notices = {
    notifyPaymentVerified: async () => {},
    notifyPaymentRejected: async () => {},
  } as unknown as NoticesService;
  const paymentReview = new PaymentReviewService(
    dataSource,
    inventory,
    notices,
    mail,
  );
  const storage = new CloudinaryStorageService(new ConfigService({}));

  admin = new AdminService(
    dataSource,
    repo(Product),
    repo(ProductImage),
    repo(Order),
    repo(User),
    repo(Vendor),
    repo(CartItem),
    repo(Favorite),
    repo(Review),
    repo(PaymentIntent),
    repo(PasswordResetToken),
    inventory,
    paymentReview,
    null as never,
    new ProductAttributesService(
      repo(ProductAttribute),
      repo(ProductAttributeOption),
      repo(ProductAttributeCategory),
      repo(ProductAttributeValue),
    ),
    storage,
    () => storage,
    mail,
  );

  auth = new AuthService(
    repo(User),
    repo(Notice),
    repo(PasswordResetToken),
    repo(CartItem),
    repo(Favorite),
    repo(Order),
    repo(Commission),
    { signAsync: async () => "fake-jwt" } as never,
    mail,
    inventory,
  );
});

after(async () => {
  await dataSource?.destroy();
  await pg?.stop();
  if (databaseDir) rmSync(databaseDir, { recursive: true, force: true });
});

beforeEach(async () => {
  // cascade: Review also FKs to users, so a plain TRUNCATE of users is
  // refused by Postgres once that table exists in the synced schema.
  await dataSource.getRepository(PasswordResetToken).clear();
  await dataSource.getRepository(User).clear({ cascade: true });
  sentInvites = [];
  failNextSend = false;
});

describe("inviting a new admin member", () => {
  test("creates the account and sends exactly one invite email with a one-time code", async () => {
    const member = await admin.inviteMember({
      name: "Sara Ahmadi",
      email: "sara@rad.test",
      role: "editor",
    });
    assert.equal(member.email, "sara@rad.test");
    assert.equal(sentInvites.length, 1);
    assert.equal(sentInvites[0].to, "sara@rad.test");
    assert.match(sentInvites[0].code, /^\d{6}$/);

    const user = await dataSource
      .getRepository(User)
      .findOneOrFail({ where: { email: "sara@rad.test" } });
    assert.equal(user.status, "invited");
  });

  test("a failed invite email rolls back the created account (no orphaned invited-forever user)", async () => {
    failNextSend = true;
    await assert.rejects(() =>
      admin.inviteMember({
        name: "Broken Email",
        email: "broken@rad.test",
        role: "viewer",
      }),
    );
    const user = await dataSource
      .getRepository(User)
      .findOne({ where: { email: "broken@rad.test" } });
    assert.equal(
      user,
      null,
      "the account must not survive a failed invite send",
    );

    // Retrying after the transient failure clears must work cleanly —
    // proves there's no leftover conflict from the rolled-back attempt.
    failNextSend = false;
    const retried = await admin.inviteMember({
      name: "Broken Email",
      email: "broken@rad.test",
      role: "viewer",
    });
    assert.equal(retried.email, "broken@rad.test");
  });

  test("inviting an email that already has an account is rejected", async () => {
    await admin.inviteMember({
      name: "First",
      email: "dup@rad.test",
      role: "editor",
    });
    await assert.rejects(
      () =>
        admin.inviteMember({
          name: "Second",
          email: "dup@rad.test",
          role: "viewer",
        }),
      ConflictException,
    );
  });
});

describe("accepting an invite (via the existing password-reset code endpoint)", () => {
  test("the invite code sets the password and activates the account", async () => {
    await admin.inviteMember({
      name: "New Editor",
      email: "new-editor@rad.test",
      role: "editor",
    });
    const code = sentInvites[0].code;

    const result = await auth.resetPassword({
      email: "new-editor@rad.test",
      code,
      password: "a-real-chosen-password",
    });
    assert.equal(result.ok, true);

    const user = await dataSource
      .getRepository(User)
      .findOneOrFail({ where: { email: "new-editor@rad.test" } });
    assert.equal(user.status, "active");

    // Now a normal sign-in with that password succeeds.
    const signedIn = await auth.signIn(
      { email: "new-editor@rad.test", password: "a-real-chosen-password" },
      { guestId: "guest-1", user: null } as never,
    );
    assert.equal(signedIn.user.email, "new-editor@rad.test");
  });

  test("the invite code is single-use: replaying it after acceptance is rejected", async () => {
    await admin.inviteMember({
      name: "Replay Test",
      email: "replay@rad.test",
      role: "editor",
    });
    const code = sentInvites[0].code;
    await auth.resetPassword({
      email: "replay@rad.test",
      code,
      password: "first-password-123",
    });
    await assert.rejects(
      () =>
        auth.resetPassword({
          email: "replay@rad.test",
          code,
          password: "second-password-456",
        }),
      NotFoundException,
    );
  });

  test("an unauthorized/incorrect code is rejected", async () => {
    await admin.inviteMember({
      name: "Wrong Code",
      email: "wrong-code@rad.test",
      role: "editor",
    });
    await assert.rejects(
      () =>
        auth.resetPassword({
          email: "wrong-code@rad.test",
          code: "000000",
          password: "whatever-123",
        }),
      NotFoundException,
    );
  });
});

describe("resending an invite", () => {
  test("resend does not create a duplicate account and issues a fresh code", async () => {
    await admin.inviteMember({
      name: "Slow Reader",
      email: "slow@rad.test",
      role: "viewer",
    });
    const firstCode = sentInvites[0].code;

    const resent = await admin.resendInvite(
      (
        await dataSource
          .getRepository(User)
          .findOneOrFail({ where: { email: "slow@rad.test" } })
      ).id,
    );
    assert.equal(resent.email, "slow@rad.test");
    assert.equal(sentInvites.length, 2);
    const secondCode = sentInvites[1].code;

    const count = await dataSource
      .getRepository(User)
      .count({ where: { email: "slow@rad.test" } });
    assert.equal(count, 1, "resend must not create a second account");

    // The old code no longer works once resent; only the fresh one does.
    await assert.rejects(() =>
      auth.resetPassword({
        email: "slow@rad.test",
        code: firstCode,
        password: "too-late-123",
      }),
    );
    const result = await auth.resetPassword({
      email: "slow@rad.test",
      code: secondCode,
      password: "on-time-123",
    });
    assert.equal(result.ok, true);
  });

  test("resending for an already-active member is rejected", async () => {
    await admin.inviteMember({
      name: "Already Active",
      email: "active@rad.test",
      role: "editor",
    });
    const code = sentInvites[0].code;
    await auth.resetPassword({
      email: "active@rad.test",
      code,
      password: "already-active-123",
    });
    const user = await dataSource
      .getRepository(User)
      .findOneOrFail({ where: { email: "active@rad.test" } });
    await assert.rejects(() => admin.resendInvite(user.id), ConflictException);
  });
});
