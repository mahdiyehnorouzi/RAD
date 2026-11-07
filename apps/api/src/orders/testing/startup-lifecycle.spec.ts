import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import {
  runCleanupStep,
  runStageWithTimeout,
  SpawnedProcessTracker,
} from "./startup-lifecycle";

/** A fake OS process: real `exit` semantics via EventEmitter, but `kill()`
 * only actually exits when the test tells it to — so a test can assert
 * "terminate() waited for the real exit", not just "kill() was called". */
class FakeProcess extends EventEmitter {
  killed = false;
  killSignal?: NodeJS.Signals;
  private onKill?: () => void;

  constructor(options: { onKill?: () => void } = {}) {
    super();
    this.onKill = options.onKill;
  }

  kill(signal?: NodeJS.Signals) {
    this.killed = true;
    this.killSignal = signal;
    this.onKill?.();
    return true;
  }

  simulateExit() {
    this.emit("exit");
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("SpawnedProcessTracker: terminate() waits for the real exit, not just for kill() to be called", async () => {
  const proc = new FakeProcess();
  const tracker = new SpawnedProcessTracker();
  tracker.attach(proc);
  assert.equal(tracker.isAlive(), true);

  let terminateResolved = false;
  const terminatePromise = tracker.terminate(5_000).then(() => {
    terminateResolved = true;
  });

  // kill() was called, but the process hasn't reported exit yet — terminate()
  // must still be pending.
  assert.equal(proc.killed, true);
  await new Promise((r) => setImmediate(r));
  assert.equal(
    terminateResolved,
    false,
    "terminate() resolved before the process actually exited",
  );

  proc.simulateExit();
  await terminatePromise;
  assert.equal(terminateResolved, true);
  assert.equal(tracker.isAlive(), false);
});

test("SpawnedProcessTracker: terminate() gives up after its own timeout if the process never exits", async () => {
  const proc = new FakeProcess(); // never calls simulateExit()
  const tracker = new SpawnedProcessTracker();
  tracker.attach(proc);

  const start = Date.now();
  await tracker.terminate(30);
  assert.ok(
    Date.now() - start < 2_000,
    "terminate() should give up quickly, not hang",
  );
});

test("SpawnedProcessTracker: watch() picks up a process that appears only after a delay (late spawn)", async () => {
  const holder: { current?: FakeProcess } = {};
  const tracker = new SpawnedProcessTracker();
  tracker.watch(() => holder.current, 2);

  assert.equal(tracker.isAlive(), false, "nothing spawned yet");

  await new Promise((r) => setTimeout(r, 20));
  holder.current = new FakeProcess();
  await new Promise((r) => setTimeout(r, 20)); // let the poll pick it up

  assert.equal(tracker.isAlive(), true, "watch() never noticed the late spawn");
  tracker.stopWatching();

  await tracker.terminate(1_000);
  assert.equal(holder.current.killed, true);
});

test("runStageWithTimeout: a stage that never settles is reported as a timeout, not left hanging", async () => {
  const never = deferred<void>();
  await assert.rejects(
    () =>
      runStageWithTimeout("never-settles", () => never.promise, {
        timeoutMs: 20,
      }),
    /timed out after 20ms waiting for stage "never-settles"/,
  );
});

test("runStageWithTimeout: late completion after a timeout is reported, never an unhandled rejection", async () => {
  const late = deferred<string>();
  const lateSettlements: Array<{ outcome: string; value: unknown }> = [];

  let caughtUnhandled: unknown;
  const onUnhandled = (reason: unknown) => {
    caughtUnhandled = reason;
  };
  process.once("unhandledRejection", onUnhandled);

  await assert.rejects(() =>
    runStageWithTimeout("late-stage", () => late.promise, {
      timeoutMs: 15,
      onLateSettlement: (info) => lateSettlements.push(info),
    }),
  );

  // The underlying operation settles well AFTER the timeout already fired
  // and the caller has already moved on (e.g. into cleanup).
  late.resolve("arrived-late");
  await new Promise((r) => setTimeout(r, 30));

  process.removeListener("unhandledRejection", onUnhandled);
  assert.equal(
    caughtUnhandled,
    undefined,
    "late resolution became an unhandled rejection",
  );
  assert.equal(lateSettlements.length, 1);
  assert.equal(lateSettlements[0].outcome, "resolved");
  assert.equal(lateSettlements[0].value, "arrived-late");
});

test("runStageWithTimeout: a late REJECTION after timeout is also reported, never an unhandled rejection", async () => {
  const late = deferred<void>();
  const lateSettlements: Array<{ outcome: string; value: unknown }> = [];

  let caughtUnhandled: unknown;
  const onUnhandled = (reason: unknown) => {
    caughtUnhandled = reason;
  };
  process.once("unhandledRejection", onUnhandled);

  await assert.rejects(() =>
    runStageWithTimeout("late-reject-stage", () => late.promise, {
      timeoutMs: 15,
      onLateSettlement: (info) => lateSettlements.push(info),
    }),
  );

  late.reject(new Error("arrived-late-and-broken"));
  await new Promise((r) => setTimeout(r, 30));

  process.removeListener("unhandledRejection", onUnhandled);
  assert.equal(caughtUnhandled, undefined);
  assert.equal(lateSettlements.length, 1);
  assert.equal(lateSettlements[0].outcome, "rejected");
  assert.equal(
    (lateSettlements[0].value as Error).message,
    "arrived-late-and-broken",
  );
});

test("runStageWithTimeout: a stage that fails quickly is NOT reported as a late settlement", async () => {
  const lateSettlements: unknown[] = [];
  await assert.rejects(() =>
    runStageWithTimeout("fast-fail", () => Promise.reject(new Error("boom")), {
      timeoutMs: 5_000,
      onLateSettlement: (info) => lateSettlements.push(info),
    }),
  );
  assert.equal(lateSettlements.length, 0);
});

test("runCleanupStep: reports a failing cleanup step as a string instead of throwing", async () => {
  const note = await runCleanupStep("destroy something", () =>
    Promise.reject(new Error("destroy exploded")),
  );
  assert.match(note ?? "", /destroy something failed:.*destroy exploded/);
});

test("runCleanupStep: bounds a hanging cleanup step with its own timeout rather than hanging forever", async () => {
  const hung = deferred<void>();
  const start = Date.now();
  const note = await runCleanupStep("hangs forever", () => hung.promise, 25);
  assert.ok(Date.now() - start < 2_000);
  assert.match(note ?? "", /hangs forever failed:.*timed out after 25ms/);
});

test("runCleanupStep: a successful cleanup step reports no note", async () => {
  const note = await runCleanupStep("fine", () => Promise.resolve());
  assert.equal(note, undefined);
});
