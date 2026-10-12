import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"),
);
process.env.RAD_VERSION ??= pkg.version;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function runWithRetry(command, args, attempts = 6) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await run(command, args);
      return;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      console.warn(`Retrying ${command} ${args.join(" ")} (${attempt}/${attempts})...`);
      await sleep(attempt * 2000);
    }
  }
  throw lastError;
}

// PM2 (and plain `kill`) send signals only to this wrapper's PID, never to
// grandchildren. Without forwarding, SIGTERM/SIGINT would just exit the
// wrapper and leave `dist/main.js` running as an orphan, invisible to
// `pm2 status`, still polling Postgres on InventoryService's sweep interval.
const FORCE_KILL_GRACE_MS = 10_000;

/** Runs the API as a child, forwarding termination signals so `pm2 restart`/`pm2 stop` actually stop it. */
function runMain() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["dist/main.js"], {
      stdio: "inherit",
      env: process.env,
    });

    let forceKillTimer = null;
    const forward = (signal) => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      child.kill(signal);
      forceKillTimer ??= setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
          child.kill("SIGKILL");
        }
      }, FORCE_KILL_GRACE_MS);
    };
    process.once("SIGTERM", () => forward("SIGTERM"));
    process.once("SIGINT", () => forward("SIGINT"));

    child.on("error", (error) => {
      if (forceKillTimer) clearTimeout(forceKillTimer);
      reject(error);
    });
    child.on("exit", (code, signal) => {
      if (forceKillTimer) clearTimeout(forceKillTimer);
      if (signal) {
        // Terminated by a forwarded signal, not a crash: exit cleanly so PM2
        // doesn't treat a graceful stop/restart as a failed process.
        resolve();
        return;
      }
      if (code === 0) resolve();
      else reject(new Error(`dist/main.js exited with code ${code}`));
    });
  });
}

async function main() {
  await runWithRetry("npx", ["tsx", "scripts/sync-schema.ts", "--if-enabled"]);
  // Always upsert owner/editor so admin login works even when full catalog seed is skipped.
  await run("npx", ["tsx", "seed/ensure-staff.ts"]);
  if (process.env.RUN_SEED === "true") {
    await run("npx", ["tsx", "seed/seed.ts"]);
  }
  await runMain();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
