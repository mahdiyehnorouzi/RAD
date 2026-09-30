#!/usr/bin/env node
/**
 * Starts Postgres (docker compose), the API and the storefront with one command.
 *
 *   npm run dev:all            # database + API + storefront
 *   npm run dev:all -- --admin # also the admin panel
 *   npm run dev:all -- --no-db # skip docker (Postgres already running)
 */
import { spawn, spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const services = [
  {
    name: "api",
    color: 36,
    command: ["run", "dev", "--workspace", "@rad/api"],
  },
  {
    name: "store",
    color: 35,
    command: ["run", "dev", "--workspace", "@rad/storefront"],
  },
];
if (args.has("--admin")) {
  services.push({
    name: "admin",
    color: 33,
    command: ["run", "dev", "--workspace", "@rad/admin"],
  });
}

if (!args.has("--no-db")) {
  console.log("[dev] starting Postgres (docker compose up -d --wait)…");
  const db = spawnSync("docker", ["compose", "up", "-d", "--wait"], {
    stdio: "inherit",
  });
  if (db.status !== 0) {
    console.error(
      "[dev] Postgres did not start. Start Docker, or run `npm run db:embedded --workspace @rad/api` and pass --no-db.",
    );
    process.exit(db.status ?? 1);
  }
}

const children = services.map(({ name, color, command }) => {
  const label = `\x1b[${color}m[${name}]\x1b[0m `;
  const child = spawn(npm, command, {
    env: { ...process.env, FORCE_COLOR: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const prefix = (stream, target) => {
    let pending = "";
    stream.on("data", (chunk) => {
      const lines = (pending + chunk).split("\n");
      pending = lines.pop();
      for (const line of lines) target.write(label + line + "\n");
    });
  };
  prefix(child.stdout, process.stdout);
  prefix(child.stderr, process.stderr);
  child.on("exit", (code) => {
    console.log(`${label}exited with ${code}`);
    shutdown(code ?? 0);
  });
  return child;
});

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 500);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
