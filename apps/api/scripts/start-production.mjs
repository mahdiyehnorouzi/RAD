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

async function main() {
  await runWithRetry("npx", ["prisma", "db", "push"]);
  if (process.env.RUN_SEED === "true") {
    await run("npx", ["prisma", "db", "seed"]);
  }
  await run(process.execPath, ["dist/main.js"]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
