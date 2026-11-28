import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../database/data-source";
import { Commission } from "../database/entities";
import { CommissionsService } from "./commissions.service";
import type { IdentityService } from "../common/identity.service";
import type { NoticesService } from "../notices/notices.service";
import type { MakingCommission } from "./commission.types";

/**
 * BUG-03: `addArtistMessage` must pass the newly-appended `StageMessage.id`
 * to `NoticesService.createForOwner`, not just the commission id - that
 * link is what lets the customer mark exactly one incoming message read
 * instead of the whole conversation. Uses the same embedded-postgres setup
 * as `commissions-conversation-sync.spec.ts`, kept in its own file rather
 * than appended to that one (it was already modified on another in-flight
 * branch as of the 2026-10 audit; AGENTS.md says to check before touching
 * it, so this stays separate).
 */

let dataSource: DataSource;
let pg: EmbeddedPostgres;
let databaseDir: string;

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-commission-notice-"));
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

test("addArtistMessage creates the commission_message notice with the new message's own id", async () => {
  const calls: Array<{
    ownerKey: string;
    kind: string;
    productSlug?: string;
    messageId?: string;
  }> = [];
  const notices = {
    createForOwner: async (
      ownerKey: string,
      kind: string,
      productSlug?: string,
      messageId?: string,
    ) => {
      calls.push({ ownerKey, kind, productSlug, messageId });
    },
  } as unknown as NoticesService;
  const identityStub = {} as IdentityService;
  const commissions = new CommissionsService(
    dataSource.getRepository(Commission),
    identityStub,
    notices,
  );

  const id = `notice-${Date.now()}`;
  await dataSource.getRepository(Commission).save({
    id,
    ownerKey: "user:customer-1",
    payload: seedCommission(id),
  });

  await commissions.addArtistMessage(id, {
    fa: "سلام",
    en: "Hello",
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].kind, "commission_message");
  assert.equal(calls[0].productSlug, id);
  assert.ok(calls[0].messageId, "a messageId must be passed");

  const row = await dataSource
    .getRepository(Commission)
    .findOneOrFail({ where: { id } });
  const payload = row.payload as MakingCommission;
  assert.equal(payload.messages.length, 1);
  assert.equal(
    calls[0].messageId,
    payload.messages[0].id,
    "the notice's messageId must match the actually-persisted message id",
  );
});

test("an internal note never creates a customer-visible notice", async () => {
  const calls: unknown[] = [];
  const notices = {
    createForOwner: async (...args: unknown[]) => {
      calls.push(args);
    },
  } as unknown as NoticesService;
  const identityStub = {} as IdentityService;
  const commissions = new CommissionsService(
    dataSource.getRepository(Commission),
    identityStub,
    notices,
  );

  const id = `notice-internal-${Date.now()}`;
  await dataSource.getRepository(Commission).save({
    id,
    ownerKey: "user:customer-2",
    payload: seedCommission(id),
  });

  await commissions.addArtistMessage(id, { fa: "یادداشت", en: "Note" }, true);

  assert.equal(calls.length, 0, "internal notes must not notify the customer");
});
