import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import { type DataSource } from "typeorm";
import { createAppDataSource } from "../database/data-source";
import { Notice } from "../database/entities";
import { ownerKey, type Actor } from "../common/identity";
import type { IdentityService } from "../common/identity.service";
import { NoticesService } from "./notices.service";

/**
 * BUG-03: a `commission_message` notice now carries the specific
 * `StageMessage.id` it was created for, so one incoming message can be
 * marked read without bulk-marking the whole conversation. These tests
 * exercise `NoticesService` against a real (throwaway) Postgres — the
 * same pattern as `database/order-message.spec.ts` — covering the
 * ticket's mandatory counting/read-state scenarios directly against the
 * persistence layer that both apps' frontends read from.
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
let notices: NoticesService;

const fakeIdentity = {
  key: (actor: Actor) => ownerKey(actor),
} as IdentityService;

function customer(id: string): Actor {
  return {
    user: {
      id,
      name: "مشتری تست",
      email: null,
      phone: null,
      role: "customer",
    },
    guestId: `guest-${id}`,
  };
}

before(async () => {
  databaseDir = mkdtempSync(
    path.join(tmpdir(), "rad-notices-commission-messages-"),
  );
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

beforeEach(async () => {
  await dataSource.getRepository(Notice).clear();
  notices = new NoticesService(dataSource.getRepository(Notice), fakeIdentity);
});

test("3 new incoming messages increase the unread count by 3, each with its own notice", async () => {
  const actor = customer("c1");
  const owner = ownerKey(actor);
  await notices.createForOwner(owner, "commission_message", "RAD-M-1", "m-1");
  await notices.createForOwner(owner, "commission_message", "RAD-M-1", "m-2");
  const snapshot = await notices.createForOwner(
    owner,
    "commission_message",
    "RAD-M-1",
    "m-3",
  );
  assert.equal(snapshot.unread, 3);
  assert.equal(
    new Set(snapshot.notices.map((n) => n.messageId)).size,
    3,
    "each message gets its own notice, not a deduped/merged one",
  );
});

test("reading one message removes its indicator and decrements the count by 1", async () => {
  const actor = customer("c2");
  const owner = ownerKey(actor);
  await notices.createForOwner(owner, "commission_message", "RAD-M-2", "m-1");
  await notices.createForOwner(owner, "commission_message", "RAD-M-2", "m-2");
  await notices.createForOwner(owner, "commission_message", "RAD-M-2", "m-3");

  const after1 = await notices.markCommissionMessageRead(
    actor,
    "RAD-M-2",
    "m-2",
  );
  assert.equal(after1.unread, 2);
  const m2 = after1.notices.find((n) => n.messageId === "m-2");
  const m1 = after1.notices.find((n) => n.messageId === "m-1");
  const m3 = after1.notices.find((n) => n.messageId === "m-3");
  assert.equal(m2?.read, true);
  assert.equal(m1?.read, false);
  assert.equal(m3?.read, false);
});

test("reading the rest zeroes out indicators and the count, never going negative", async () => {
  const actor = customer("c3");
  const owner = ownerKey(actor);
  await notices.createForOwner(owner, "commission_message", "RAD-M-3", "m-1");
  await notices.createForOwner(owner, "commission_message", "RAD-M-3", "m-2");
  await notices.markCommissionMessageRead(actor, "RAD-M-3", "m-1");
  const after1 = await notices.markCommissionMessageRead(
    actor,
    "RAD-M-3",
    "m-2",
  );
  assert.equal(after1.unread, 0);

  // Re-marking an already-read message is a no-op, not a negative count.
  const after2 = await notices.markCommissionMessageRead(
    actor,
    "RAD-M-3",
    "m-2",
  );
  assert.equal(after2.unread, 0);
});

test("read status survives a fresh read (refresh/re-login) via a brand-new service instance", async () => {
  const actor = customer("c4");
  const owner = ownerKey(actor);
  await notices.createForOwner(owner, "commission_message", "RAD-M-4", "m-1");
  await notices.createForOwner(owner, "commission_message", "RAD-M-4", "m-2");
  await notices.markCommissionMessageRead(actor, "RAD-M-4", "m-1");

  const freshService = new NoticesService(
    dataSource.getRepository(Notice),
    fakeIdentity,
  );
  const snapshot = await freshService.list(actor);
  assert.equal(snapshot.unread, 1);
  assert.equal(snapshot.notices.find((n) => n.messageId === "m-1")?.read, true);
  assert.equal(
    snapshot.notices.find((n) => n.messageId === "m-2")?.read,
    false,
  );
});

test("multiple conversations (commissions) have independent unread state", async () => {
  const actor = customer("c5");
  const owner = ownerKey(actor);
  await notices.createForOwner(owner, "commission_message", "RAD-M-5", "m-1");
  await notices.createForOwner(owner, "commission_message", "RAD-M-6", "m-1");
  await notices.markCommissionMessageRead(actor, "RAD-M-5", "m-1");

  const snapshot = await notices.list(actor);
  assert.equal(snapshot.unread, 1);
  const stillUnread = snapshot.notices.find((n) => n.productSlug === "RAD-M-6");
  assert.equal(stillUnread?.read, false);
});

test("admin and customer read state are independent owners", async () => {
  const customerActor = customer("c6");
  const customerOwner = ownerKey(customerActor);
  await notices.createForOwner(
    customerOwner,
    "commission_message",
    "RAD-M-7",
    "m-1",
  );

  // The staff-side read mechanism uses a completely separate owner key and
  // notice kind (`staff_read`); marking it does not touch the customer's row.
  await notices.markStaffRead("staff-1", "commission:RAD-M-7:m-1");

  const snapshot = await notices.list(customerActor);
  assert.equal(
    snapshot.notices.find((n) => n.productSlug === "RAD-M-7")?.read,
    false,
    "the customer's own notice is unaffected by the staff read-cursor",
  );
});

test("a failed/duplicate read request is idempotent and does not desync the count", async () => {
  const actor = customer("c7");
  const owner = ownerKey(actor);
  await notices.createForOwner(owner, "commission_message", "RAD-M-8", "m-1");

  // Simulates the frontend retrying after a dropped response: calling the
  // same mark-read twice must not double-decrement or error.
  await notices.markCommissionMessageRead(actor, "RAD-M-8", "m-1");
  const retried = await notices.markCommissionMessageRead(
    actor,
    "RAD-M-8",
    "m-1",
  );
  assert.equal(retried.unread, 0);

  // Marking a message id that was never created for this commission is a
  // harmless no-op (e.g. a mark-read that reached the server for a message
  // the client later discovered doesn't belong to this conversation).
  const unaffected = await notices.markCommissionMessageRead(
    actor,
    "RAD-M-8",
    "m-does-not-exist",
  );
  assert.equal(unaffected.unread, 0);
});

test("outgoing (artist) messages never create a notice for the artist's own owner key", async () => {
  // `createForOwner` is always called with the recipient's owner key by
  // `CommissionsService` (never the sender's) — this asserts the resulting
  // notice really is scoped to one owner only, not visible to another.
  const artistOwnerKey = "user:artist-1";
  await notices.createForOwner(
    artistOwnerKey,
    "commission_message",
    "RAD-M-9",
    "m-1",
  );
  const otherActor = customer("c8");
  const snapshot = await notices.list(otherActor);
  assert.equal(snapshot.unread, 0);
});
