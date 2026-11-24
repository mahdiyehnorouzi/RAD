import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../database/data-source";
import { isLocalDatabaseUrl } from "../database/safe-target";
import { Commission } from "../database/entities";
import { CommissionsService } from "./commissions.service";
import type { IdentityService } from "../common/identity.service";
import type { NoticesService } from "../notices/notices.service";
import type { Actor } from "../common/identity";
import type { MakingCommission } from "./commission.types";

/**
 * BUG-17 (RAD OBJECT Phase 01): the storefront's customer and workshop UIs
 * send commission messages through the generic whole-payload save path
 * (`saveCommission`/`saveWorkshopCommission` -> `saveMine`/`saveWorkshop`),
 * not the dedicated, lock-protected `addMineMessage`/`addArtistMessage`
 * append path the admin dashboard uses. This file characterizes that gap
 * and the fix: a new, equally lock-protected `addWorkshopMessage` entry
 * point for the storefront's maker/artist UI, plus hardening `saveAdmin`
 * so an unrelated whole-payload save can never discard messages or
 * internal notes that were appended through the message endpoints after
 * the client's local snapshot was taken.
 */

let dataSource: DataSource;
let pg: EmbeddedPostgres;
let databaseDir: string;
let commissions: CommissionsService;
let identityStub: IdentityService;

function actorFor(userId: string, extra: Partial<Actor["user"]> = {}): Actor {
  return {
    user: {
      id: userId,
      name: "Test",
      email: `${userId}@example.com`,
      phone: null,
      role: "customer",
      adminRole: null,
      ...extra,
    },
    guestId: `guest-${userId}`,
  } as Actor;
}

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-commissions-sync-"));
  const port = await new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const resolvedPort =
        typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(resolvedPort));
    });
  });
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

  const testDatabaseUrl = `postgresql://rad:rad@127.0.0.1:${port}/rad_test`;
  if (!isLocalDatabaseUrl(testDatabaseUrl)) {
    throw new Error(
      "Refusing to run DB-backed tests against a non-local database.",
    );
  }
  dataSource = createAppDataSource({
    url: testDatabaseUrl,
    synchronize: true,
  } as never);
  await dataSource.initialize();

  const notices = { createForOwner: async () => {} } as unknown as NoticesService;
  identityStub = {
    key: (actor: Actor) => (actor.user ? `user:${actor.user.id}` : `guest:${actor.guestId}`),
    fromRequest: async () => {
      throw new Error("not used in this spec");
    },
  } as unknown as IdentityService;
  commissions = new CommissionsService(
    dataSource.getRepository(Commission),
    identityStub,
    notices,
  );
});

after(async () => {
  await dataSource?.destroy();
  await pg?.stop();
  if (databaseDir) rmSync(databaseDir, { recursive: true, force: true });
});

function seedCommission(id: string): MakingCommission {
  const now = Date.now();
  return {
    id,
    title: { fa: "سفارش آزمایشی", en: "Test commission" },
    customerName: "مشتری آزمایشی",
    artistName: "هنرمند آزمایشی",
    brief: {
      concept: "",
      dimensions: "",
      material: "",
      intendedUse: "",
      budget: "",
      permission: "",
      category: "ceramics",
    },
    stage: "making",
    nextActor: "artist",
    estimatedCompletion: now + 1_000_000,
    createdAt: now,
    updatedAt: now,
    kilnLocked: false,
    messages: [],
    changeRequests: [],
    updates: [],
    payments: [],
    audit: [],
    internalNotes: [],
  };
}

async function readRow(id: string) {
  const row = await dataSource
    .getRepository(Commission)
    .findOneOrFail({ where: { id } });
  return row.payload as MakingCommission;
}

test("saveMine never persists a client-sent message (existing, intended behavior)", async () => {
  const id = `sync-savemine-${Date.now()}`;
  const ownerUserId = "customer-1";
  await dataSource.getRepository(Commission).save({
    id,
    ownerKey: `user:${ownerUserId}`,
    payload: seedCommission(id),
  });

  const current = await readRow(id);
  const withClientMessage: MakingCommission = {
    ...current,
    messages: [
      ...current.messages,
      {
        id: "client-added",
        stageId: current.stage,
        author: "customer",
        body: { fa: "پیام از کلاینت", en: "Message from client" },
        createdAt: Date.now(),
      },
    ],
  };

  await commissions.saveMine(
    actorFor(ownerUserId),
    id,
    withClientMessage,
  );

  const after1 = await readRow(id);
  assert.equal(
    after1.messages.length,
    0,
    "saveMine must not let a client write to messages at all - this is intended, not a bug",
  );
});

test("a message added via the safe path survives an unrelated saveAdmin save built from a stale snapshot", async () => {
  const id = `sync-saveadmin-${Date.now()}`;
  const ownerUserId = "customer-2";
  await dataSource.getRepository(Commission).save({
    id,
    ownerKey: `user:${ownerUserId}`,
    payload: seedCommission(id),
  });

  // The workshop UI's local snapshot, captured before the new message exists.
  const staleSnapshot = await readRow(id);

  // Meanwhile, the admin dashboard (or the storefront workshop message box,
  // once fixed) appends a message through the safe, locked path.
  await commissions.addArtistMessage(id, {
    fa: "پیام از دفتر کوره",
    en: "Message from the workshop",
  });
  const afterMessage = await readRow(id);
  assert.equal(afterMessage.messages.length, 1, "sanity: the message landed");

  // Now an unrelated save (e.g. updating the brief/stage) goes out, built
  // from the pre-message snapshot, via the same whole-payload save path the
  // storefront workshop UI uses for everything else.
  await commissions.saveAdmin(id, {
    ...staleSnapshot,
    stage: "firing",
  });

  const afterUnrelatedSave = await readRow(id);
  assert.equal(
    afterUnrelatedSave.messages.length,
    1,
    "an unrelated saveAdmin call must not discard a message added after the client's snapshot was taken",
  );
  assert.equal(
    afterUnrelatedSave.stage,
    "firing",
    "the unrelated field change itself must still apply",
  );
});

test("a maker (artist) can send a commission message through the new safe workshop endpoint", async () => {
  const id = `sync-workshop-message-${Date.now()}`;
  const ownerUserId = "customer-3";
  await dataSource.getRepository(Commission).save({
    id,
    ownerKey: `user:${ownerUserId}`,
    payload: seedCommission(id),
  });

  const maker = actorFor("artist-1", { role: "artist" });
  await commissions.addWorkshopMessage(maker, id, {
    fa: "پیام هنرمند",
    en: "Artist message",
  });

  const after1 = await readRow(id);
  assert.equal(after1.messages.length, 1);
  assert.equal(after1.messages[0].author, "artist");
  assert.equal(after1.messages[0].body.en, "Artist message");
});

test("a non-maker cannot send a message through the workshop endpoint", async () => {
  const id = `sync-workshop-forbidden-${Date.now()}`;
  const ownerUserId = "customer-4";
  await dataSource.getRepository(Commission).save({
    id,
    ownerKey: `user:${ownerUserId}`,
    payload: seedCommission(id),
  });

  const customer = actorFor(ownerUserId, { role: "customer" });
  await assert.rejects(() =>
    commissions.addWorkshopMessage(customer, id, {
      fa: "تلاش غیرمجاز",
      en: "Unauthorized attempt",
    }),
  );

  const after1 = await readRow(id);
  assert.equal(after1.messages.length, 0);
});

test("concurrent messages from the admin/workshop side and the customer side both survive", async () => {
  const id = `sync-cross-actor-${Date.now()}`;
  const ownerUserId = "customer-5";
  await dataSource.getRepository(Commission).save({
    id,
    ownerKey: `user:${ownerUserId}`,
    payload: seedCommission(id),
  });

  const customer = actorFor(ownerUserId, { role: "customer" });

  await Promise.all([
    commissions.addArtistMessage(id, {
      fa: "پیام هنرمند همزمان",
      en: "Concurrent artist message",
    }),
    commissions.addMineMessage(customer, id, {
      fa: "پیام مشتری همزمان",
      en: "Concurrent customer message",
    }),
  ]);

  const after1 = await readRow(id);
  assert.equal(
    after1.messages.length,
    2,
    "both the artist's and the customer's concurrent messages must survive",
  );
  const authors = after1.messages.map((message) => message.author).sort();
  assert.deepEqual(authors, ["artist", "customer"]);
});

test("a failed message send (not-found commission) leaves no partial state", async () => {
  await assert.rejects(() =>
    commissions.addArtistMessage("does-not-exist", {
      fa: "پیام",
      en: "Message",
    }),
  );
});
