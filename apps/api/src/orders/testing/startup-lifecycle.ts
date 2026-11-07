/**
 * Generic, dependency-free lifecycle primitives used by `purchase-harness.ts`
 * to start a throwaway embedded Postgres + DataSource safely: per-stage
 * timeouts, tracking + terminating the real OS process independently of
 * whatever promise embedded-postgres happens to be holding, and bounded,
 * failure-tolerant cleanup. Kept separate from `purchase-harness.ts` (which
 * wires real NestJS services) so these failure paths — timeout, a stage
 * that settles AFTER its timeout already fired, and cleanup itself failing —
 * can be exercised deterministically with fakes in
 * `startup-lifecycle.spec.ts`, without needing a real Postgres binary.
 */

/** The minimal shape we need from a spawned child process to track and
 * terminate it — matches Node's `ChildProcess` structurally. */
export interface ProcessHandle {
  pid?: number;
  kill(signal?: NodeJS.Signals): boolean | void;
  once(event: "exit", listener: () => void): unknown;
}

function describe(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (value === undefined)
    return "undefined (no error object — see embedded-postgres's own start() behavior)";
  try {
    return typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export { describe };

/**
 * Thrown by `terminate()` when it could not CONFIRM the process is gone
 * within its bound — either because it was signalled but never reported
 * exiting, or because it's unclear whether a process might still appear.
 * Callers must treat this differently from a clean resolution: it means
 * "do not assume it's safe to remove anything this process might still be
 * using" (see `purchase-harness.ts`'s cleanup, which keeps the data
 * directory on disk rather than delete it out from under a process it
 * couldn't confirm was dead).
 */
export class ProcessTerminationTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProcessTerminationTimeoutError";
  }
}

/**
 * Tracks the actual OS process behind an embedded-postgres instance,
 * independent of whether the higher-level `start()` promise has resolved.
 * `start()` only resolves once Postgres prints its "ready" line, but the
 * process can be alive (and need killing) long before that — including
 * when `start()` itself has timed out and we're mid-cleanup — or it can
 * already be gone by the time we look. We discover it by polling a
 * `process` field that embedded-postgres sets synchronously(ish) as soon
 * as it spawns the child, rather than waiting for `start()` to settle.
 */
export class SpawnedProcessTracker {
  private handle?: ProcessHandle;
  private exited = false;
  private pollTimer?: NodeJS.Timeout;

  /** Starts polling `read()` every `intervalMs` until `stopWatching()` is
   * called, attaching to whatever process handle appears (and to a later
   * one too, if `read()` ever returns a different handle). Watching is
   * deliberately cheap to leave running for the lifetime of a setup
   * attempt PLUS its cleanup — ownership of "a process might still show up
   * here" starts the moment the caller believes `start()`-equivalent has
   * been invoked, not when some stage's timeout happens to fire, and a
   * late-appearing process must still be discovered by whoever is
   * watching at the time. */
  watch(read: () => ProcessHandle | undefined, intervalMs = 5) {
    this.pollTimer = setInterval(() => {
      const current = read();
      if (current && current !== this.handle) {
        this.attach(current);
      }
    }, intervalMs);
    this.pollTimer.unref?.();
  }

  stopWatching() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = undefined;
  }

  /** Attach directly to a known handle (used by `watch()`, and directly by
   * tests that don't want to exercise the polling itself). */
  attach(handle: ProcessHandle) {
    this.handle = handle;
    this.exited = false;
    handle.once("exit", () => {
      this.exited = true;
    });
  }

  isAlive(): boolean {
    return !!this.handle && !this.exited;
  }

  /** True once a real process handle has ever been attached (regardless of
   * whether it has since exited). Used to tell "nothing was ever spawned"
   * apart from "something was spawned and is now gone". */
  everAttached(): boolean {
    return !!this.handle;
  }

  /**
   * Terminates the tracked process and CONFIRMS it (via its own `exit`
   * event — never assumed just because `kill()` was called) within
   * `timeoutMs`, rejecting with `ProcessTerminationTimeoutError` if it
   * cannot confirm that in time. The caller MUST treat a reject here as
   * "unsafe to assume this process, or whatever it was using, is gone" —
   * never as equivalent to a clean resolution.
   *
   * `expectPossibleLateArrival`: when true, and no process is attached yet,
   * this keeps waiting (up to `timeoutMs`) for one to appear via whatever
   * `watch()` discovers in the background, rather than immediately
   * declaring "nothing to terminate" — because the caller has told us a
   * process may still legitimately show up (e.g. `start()` was called but
   * hadn't spawned anything the instant we looked). When false and nothing
   * is attached, resolves immediately: there is nothing that could ever
   * appear (e.g. `start()` was never even called), so declaring "confirmed,
   * nothing to terminate" is safe, not just convenient.
   */
  terminate(
    timeoutMs = 5_000,
    options: { expectPossibleLateArrival?: boolean } = {},
  ): Promise<void> {
    if (!this.handle && !options.expectPossibleLateArrival) {
      return Promise.resolve();
    }

    const deadline = Date.now() + timeoutMs;
    let killed = false;

    return new Promise<void>((resolve, reject) => {
      const poll = () => {
        if (this.handle && this.exited) {
          // Confirmed — no further timer is scheduled, so nothing lingers
          // past this point.
          resolve();
          return;
        }
        if (this.handle && !killed) {
          killed = true;
          try {
            this.handle.kill("SIGKILL");
          } catch {
            // Process may already be gone between our check and here.
          }
        }
        if (Date.now() >= deadline) {
          reject(
            new ProcessTerminationTimeoutError(
              this.handle
                ? `process was signalled but did not confirm exit within ${timeoutMs}ms`
                : `no process was observed within ${timeoutMs}ms — termination could not be confirmed`,
            ),
          );
          return;
        }
        setTimeout(poll, 5);
      };
      poll();
    });
  }
}

export interface LateSettlement {
  stage: string;
  outcome: "resolved" | "rejected";
  value: unknown;
}

/**
 * Runs `operation()` and races it against a `timeoutMs` timer. If the timer
 * wins, rejects with a timeout error — but `operation()`'s own promise is
 * never abandoned: a handler is always attached to it so that if it settles
 * later (resolves or rejects, after we've already moved on), that settlement
 * (a) never becomes a Node `unhandledRejection` and (b) is reported via
 * `onLateSettlement` rather than silently dropped or allowed to race with
 * whatever cleanup already ran.
 */
export async function runStageWithTimeout<T>(
  stage: string,
  operation: () => Promise<T>,
  options: {
    timeoutMs: number;
    onLateSettlement?: (info: LateSettlement) => void;
  },
): Promise<T> {
  let timedOut = false;
  let timer!: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      reject(
        new Error(
          `timed out after ${options.timeoutMs}ms waiting for stage "${stage}"`,
        ),
      );
    }, options.timeoutMs);
  });

  const operationPromise = operation();
  // Always attach — regardless of which side of the race wins — so a late
  // settlement is observed instead of becoming an unhandled rejection.
  operationPromise.then(
    (value) => {
      if (timedOut) {
        options.onLateSettlement?.({ stage, outcome: "resolved", value });
      }
    },
    (error) => {
      if (timedOut) {
        options.onLateSettlement?.({
          stage,
          outcome: "rejected",
          value: error,
        });
      }
    },
  );

  try {
    return await Promise.race([operationPromise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Runs a cleanup step with its own bounded timeout, so a hung `stop()` /
 * `destroy()` can never mask or indefinitely delay surfacing the ORIGINAL
 * setup error. Never throws — failures are reported as plain strings so the
 * caller can attach them as secondary diagnostics without risking the
 * reporting itself throwing past the caller.
 */
export async function runCleanupStep(
  label: string,
  fn: () => Promise<void>,
  timeoutMs = 5_000,
): Promise<string | undefined> {
  try {
    await runStageWithTimeout(label, fn, { timeoutMs });
    return undefined;
  } catch (error) {
    return `${label} failed: ${describe(error)}`;
  }
}
