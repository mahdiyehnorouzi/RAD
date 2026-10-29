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
import type { MakingCommission } from "./commission.types";

/**
 * DB-backed coverage for the lost-update race fixed in
 * `CommissionsService.mutateCommission`: every write here used to be
 * read -> compute `next` in JS -> blind update(), with no lock or version
 * check, so two concurrent writers (two admins, or an admin and the
 * customer) could silently clobber each other's message/stage/audit
 * entry. Uses a real, ephemeral embedded Postgres — the race only shows
 * up against real row-level timing, not an in-memory stub.
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

let dataSource: DataSource;
let pg: EmbeddedPostgres;
let databaseDir: string;
let commissions: CommissionsService;

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-commissions-"));
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

  const notices = {
    createForOwner: async () => {},
  } as unknown as NoticesService;
  commissions = new CommissionsService(
    dataSource.getRepository(Commission),
    null as unknown as IdentityService,
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
    stage: "design_submitted",
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

test("two concurrent artist messages on the same commission both survive (no lost update)", async () => {
  const id = `race-${Date.now()}`;
  await dataSource.getRepository(Commission).save({
    id,
    ownerKey: "user:test-customer",
    payload: seedCommission(id),
  });

  await Promise.all([
    commissions.addArtistMessage(id, { fa: "پیام اول", en: "First message" }),
    commissions.addArtistMessage(id, {
      fa: "پیام دوم",
      en: "Second message",
    }),
  ]);

  const row = await dataSource
    .getRepository(Commission)
    .findOneOrFail({ where: { id } });
  const payload = row.payload as MakingCommission;
  assert.equal(
    payload.messages.length,
    2,
    "both concurrent messages must be present - neither should have been silently overwritten",
  );
  const bodies = payload.messages.map((message) => message.body.en).sort();
  assert.deepEqual(bodies, ["First message", "Second message"]);
});

test("a concurrent admin decide() and artist message both land", async () => {
  const id = `race-decide-${Date.now()}`;
  await dataSource.getRepository(Commission).save({
    id,
    ownerKey: "user:test-customer",
    payload: seedCommission(id),
  });

  await Promise.all([
    commissions.addArtistMessage(id, {
      fa: "یادداشت داخلی",
      en: "Internal note",
    }),
    commissions.beginReview(id),
  ]);

  const row = await dataSource
    .getRepository(Commission)
    .findOneOrFail({ where: { id } });
  const payload = row.payload as MakingCommission;
  assert.equal(
    payload.messages.length,
    1,
    "the concurrent message must survive",
  );
  assert.equal(
    payload.stage,
    "feasibility",
    "beginReview's stage change must also survive, not be overwritten by the message write",
  );
});
