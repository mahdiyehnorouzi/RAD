import { spawn } from "node:child_process";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
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

async function runWithRetry(command: string, args: string[], attempts = 6) {
  let lastError: unknown;
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
