import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { existsSync, rmSync } from "node:fs";
import { test } from "node:test";
import { startPurchaseHarness } from "./purchase-harness";

/**
 * Deterministic coverage for the harness's own setup-failure lifecycle:
 * a stage timing out, a stage settling LATE (after its timeout already
 * fired and cleanup already ran), and cleanup itself failing. These are
 * exercised via `startPurchaseHarness`'s dependency overrides with a fake
 * embedded-Postgres — never a real Postgres binary — so timing is exact,
 * not a race. `purchase-harness.spec.ts`-adjacent specs (e.g.
 * `admin-gateway-reconcile.spec.ts`) already cover the happy path end to
 * end; none of those exercise any of this.
 */

class FakeProcess extends EventEmitter {
  killed = false;
  private exitsOnKill: boolean;

  constructor(options: { exitsOnKill?: boolean } = {}) {
    super();
    this.exitsOnKill = options.exitsOnKill ?? true;
  }

  kill() {
    this.killed = true;
    if (this.exitsOnKill) {
      // Real child processes exit asynchronously, never synchronously
      // inside kill() itself.
      setImmediate(() => this.emit("exit"));
    }
    return true;
  }
}

function neverSettles(): Promise<void> {
  return new Promise(() => {});
}

function fakeDataSource() {
  return {
    initialize: async () => undefined,
    destroy: async () => undefined,
  } as unknown as import("typeorm").DataSource;
}

test("startup timeout: a stage that hangs is surfaced as a timeout, and the real process is terminated before the data directory is removed", async () => {
  let capturedDatabaseDir = "";
  const fakeProc = new FakeProcess();

  await assert.rejects(
    () =>
      startPurchaseHarness({
        stageTimeoutMs: 20,
        cleanupTimeoutMs: 1_000,
        createEmbeddedPostgres: (options) => {
          capturedDatabaseDir = options.databaseDir;
          return {
            initialise: async () => undefined,
            // Simulate the server process existing (and needing to be
            // killed) even though start() itself never settles.
            start: () => {
              setTimeout(() => {
                // attach "late", like a real spawn that takes a moment
              }, 0);
              return neverSettles();
            },
            createDatabase: async () => undefined,
            stop: async () => undefined,
            get process() {
              return fakeProc;
            },
          };
        },
        createDataSource: () => fakeDataSource(),
      }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /stage "pg\.start"/);
      assert.match(error.message, /timed out after 20ms/);
      return true;
    },
  );

  assert.equal(
    fakeProc.killed,
    true,
    "the real process was never asked to terminate",
  );
  assert.equal(
    existsSync(capturedDatabaseDir),
    false,
    "the data directory was removed even though it's unclear the process had exited yet",
  );
});

test("late completion after timeout: a stage's underlying promise resolving after the timeout fired does not surface as success or crash the process", async () => {
  let resolveStart!: () => void;
  const startPromise = new Promise<void>((resolve) => {
    resolveStart = resolve;
  });

  let caughtUnhandled: unknown;
  const onUnhandled = (reason: unknown) => {
    caughtUnhandled = reason;
  };
  process.once("unhandledRejection", onUnhandled);

  const fakeProc = new FakeProcess();

  await assert.rejects(() =>
    startPurchaseHarness({
      stageTimeoutMs: 20,
      cleanupTimeoutMs: 1_000,
      createEmbeddedPostgres: () => ({
        initialise: async () => undefined,
        start: () => startPromise,
        createDatabase: async () => undefined,
        stop: async () => undefined,
        get process() {
          return fakeProc;
        },
      }),
      createDataSource: () => fakeDataSource(),
    }),
  );

  // The real embedded-postgres start() keeps running even after we've given
  // up on it and moved into cleanup — simulate it finally "succeeding" well
  // after the fact.
  resolveStart();
  await new Promise((r) => setTimeout(r, 50));

  process.removeListener("unhandledRejection", onUnhandled);
  assert.equal(
    caughtUnhandled,
    undefined,
    "a late resolution after timeout became an unhandled rejection",
  );
});

test("cleanup failure is attached as secondary diagnostic, and never replaces the original setup error", async () => {
  // This process never reports exit, so terminate() will itself time out —
  // cleanup failing in exactly the way a wedged real postgres could.
  const fakeProc = new FakeProcess({ exitsOnKill: false });

  await assert.rejects(
    () =>
      startPurchaseHarness({
        stageTimeoutMs: 20,
        cleanupTimeoutMs: 20,
        createEmbeddedPostgres: () => ({
          initialise: async () => undefined,
          start: () => neverSettles(),
          createDatabase: async () => undefined,
          stop: async () => undefined,
          get process() {
            return fakeProc;
          },
        }),
        createDataSource: () => fakeDataSource(),
      }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      // The ORIGINAL failure (the setup timeout) is still what's reported...
      assert.match(error.message, /stage "pg\.start"/);
      assert.match(
        error.message,
        /timed out after 20ms waiting for stage "pg\.start"/,
      );
      // ...with the cleanup failure attached as secondary information, not
      // swapped in as if it were the real cause.
      assert.match(error.message, /cleanup diagnostics/);
      assert.match(
        error.message,
        /terminate postgres process failed:.*did not confirm exit within 20ms/,
      );
      assert.equal(error.cause instanceof Error, true);
      assert.match(
        (error.cause as Error).message,
        /timed out after 20ms waiting for stage "pg\.start"/,
      );
      return true;
    },
  );

  assert.equal(
    fakeProc.killed,
    true,
    "cleanup should still have attempted to kill it",
  );
});

/**
 * Regression coverage for three gaps a later review round found in the
 * lifecycle fix above: these assert actual resource/filesystem state and
 * call ordering — not just the shape of a thrown error message, which the
 * tests above already cover.
 */

test("REGRESSION: a process that never confirms exit leaves the data directory INTACT, never deleted out from under it", async () => {
  let capturedDatabaseDir = "";
  const fakeProc = new FakeProcess({ exitsOnKill: false }); // kill() is called, 'exit' never fires

  try {
    await assert.rejects(() =>
      startPurchaseHarness({
        stageTimeoutMs: 20,
        cleanupTimeoutMs: 20,
        createEmbeddedPostgres: (options) => {
          capturedDatabaseDir = options.databaseDir;
          return {
            initialise: async () => undefined,
            start: () => neverSettles(),
            createDatabase: async () => undefined,
            stop: async () => undefined,
            get process() {
              return fakeProc;
            },
          };
        },
        createDataSource: () => fakeDataSource(),
      }),
    );

    assert.equal(fakeProc.killed, true, "it should still have been signalled");
    assert.equal(
      existsSync(capturedDatabaseDir),
      true,
      "the data directory was deleted even though the process's exit was never confirmed",
    );
  } finally {
    // The harness correctly refuses to delete this directory itself (that's
    // the whole point of the test) — clean it up here so the test suite
    // doesn't leak real temp directories across runs.
    if (capturedDatabaseDir)
      rmSync(capturedDatabaseDir, { recursive: true, force: true });
  }
});

test("REGRESSION: a process discovered only AFTER the setup timeout already fired is still found and terminated by cleanup, not leaked", async () => {
  let capturedDatabaseDir = "";
  const holder: { proc?: FakeProcess } = {};

  await assert.rejects(() =>
    startPurchaseHarness({
      stageTimeoutMs: 20,
      // The process doesn't exist yet when "pg.start" times out at 20ms —
      // it only appears ~50ms in, well after that stage has already
      // rejected and cleanup has begun. Cleanup must still be watching.
      cleanupTimeoutMs: 500,
      createEmbeddedPostgres: (options) => {
        capturedDatabaseDir = options.databaseDir;
        setTimeout(() => {
          holder.proc = new FakeProcess();
        }, 50);
        return {
          initialise: async () => undefined,
          start: () => neverSettles(),
          createDatabase: async () => undefined,
          stop: async () => undefined,
          get process() {
            return holder.proc;
          },
        };
      },
      createDataSource: () => fakeDataSource(),
    }),
  );

  assert.ok(holder.proc, "the late-appearing process was never even observed");
  assert.equal(
    holder.proc!.killed,
    true,
    "a process that appeared after the timeout was leaked, never terminated",
  );
  assert.equal(
    existsSync(capturedDatabaseDir),
    false,
    "termination was confirmed, so the data directory should have been removed",
  );
});

test("REGRESSION: a DataSource whose initialize() resolves AFTER its timeout still gets destroy()ed, not just logged", async () => {
  let resolveInitialize!: () => void;
  const initializePromise = new Promise<void>((resolve) => {
    resolveInitialize = resolve;
  });
  let destroyCalls = 0;

  await assert.rejects(() =>
    startPurchaseHarness({
      stageTimeoutMs: 20,
      cleanupTimeoutMs: 1_000,
      createEmbeddedPostgres: () => ({
        initialise: async () => undefined,
        start: async () => undefined,
        createDatabase: async () => undefined,
        stop: async () => undefined,
      }),
      createDataSource: () =>
        ({
          initialize: () => initializePromise,
          destroy: async () => {
            destroyCalls += 1;
          },
        }) as unknown as import("typeorm").DataSource,
    }),
  );

  // Cleanup already attempted one destroy() while initialize() was still
  // pending (it may well have been a no-op against a not-yet-initialized
  // DataSource — that's fine, it's bounded and best-effort).
  const destroyCallsRightAfterCleanup = destroyCalls;

  // The DataSource finishes initializing well after we'd already given up
  // and moved on — simulating a slow connection that eventually succeeds.
  resolveInitialize();
  await new Promise((r) => setTimeout(r, 30));

  assert.ok(
    destroyCalls > destroyCallsRightAfterCleanup,
    "a DataSource that finished initializing after its timeout was never destroy()ed — only logged",
  );
});
