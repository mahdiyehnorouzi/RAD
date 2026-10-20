import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, test } from "node:test";

/**
 * The break-glass recovery script validates its three independent
 * confirmations (email / new password / explicit confirm phrase) BEFORE
 * ever opening a database connection, so these guard rails are fully
 * testable without a real Postgres — only the actual password write
 * (after all three checks pass) needs one, and that write path is the
 * same `users.update(...)` already covered via `ensureStaff`'s hashing
 * logic in `seed/ensure-staff.spec.ts`.
 *
 * Runs the script as a real subprocess (not an import) so the
 * `require.main === module` guard that gates `main()` behaves exactly as
 * it does in production use.
 */
const scriptPath = path.join(__dirname, "recover-admin-password.ts");

function runScript(env: Record<string, string | undefined>) {
  const result = spawnSync(
    process.execPath,
    [require.resolve("tsx/cli"), scriptPath],
    {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, ...env },
      encoding: "utf8",
      timeout: 15_000,
    },
  );
  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

describe("recover-admin-password.ts: guard rails run before any DB connection", () => {
  test("refuses with no env vars set at all", () => {
    const { status, output } = runScript({
      RAD_RECOVERY_EMAIL: "",
      RAD_RECOVERY_NEW_PASSWORD: "",
      RAD_RECOVERY_CONFIRM: "",
    });
    assert.notEqual(status, 0);
    assert.match(output, /RAD_RECOVERY_EMAIL/);
  });

  test("refuses a new password shorter than 8 characters", () => {
    const { status, output } = runScript({
      RAD_RECOVERY_EMAIL: "owner@example.test",
      RAD_RECOVERY_NEW_PASSWORD: "short",
      RAD_RECOVERY_CONFIRM: "yes-recover-owner@example.test",
    });
    assert.notEqual(status, 0);
    assert.match(output, /RAD_RECOVERY_NEW_PASSWORD/);
    // The too-short password itself must never appear in the output.
    assert.doesNotMatch(output, /short/);
  });

  test("refuses when the confirm phrase doesn't match the target email", () => {
    const { status, output } = runScript({
      RAD_RECOVERY_EMAIL: "owner@example.test",
      RAD_RECOVERY_NEW_PASSWORD: "a-fine-new-password",
      RAD_RECOVERY_CONFIRM: "yes-recover-someone-else@example.test",
    });
    assert.notEqual(status, 0);
    assert.match(output, /RAD_RECOVERY_CONFIRM/);
  });

  test("a chosen password never appears in stdout/stderr even on the success path's later (DB) failure", () => {
    const { output } = runScript({
      RAD_RECOVERY_EMAIL: "owner@example.test",
      RAD_RECOVERY_NEW_PASSWORD: "a-very-unique-marker-password-999",
      RAD_RECOVERY_CONFIRM: "yes-recover-owner@example.test",
      // No real DB is reachable here, so this fails at dataSource.initialize()
      // — the point is only that it got PAST the three guard rails first.
      DATABASE_URL: "postgresql://rad:rad@127.0.0.1:1/rad_nonexistent",
    });
    assert.doesNotMatch(output, /a-very-unique-marker-password-999/);
  });
});
