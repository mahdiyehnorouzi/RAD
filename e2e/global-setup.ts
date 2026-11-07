/**
 * RAD-134 local E2E harness bootstrap.
 *
 * Starts, entirely inside this one long-lived process (the same process
 * Playwright keeps alive for the whole run):
 *   1. A disposable embedded Postgres (random port, temp data dir).
 *   2. One deterministic 1/1 test product, seeded with the same code
 *      production seeding uses.
 *   3. A local mock ZarinPal gateway (`support/mock-zarinpal.ts`).
 *   4. The real API (`nest build` + `node dist/main.js`), pointed at the
 *      disposable DB and the mock gateway via env vars only.
 *   5. The real storefront (`next dev`), pointed at that API.
 *
 * Fails closed before starting anything: refuses to run if the ambient
 * environment looks like it could touch production (NODE_ENV=production,
 * a real ZarinPal merchant id already configured, or a DATABASE_URL this
 * script did not itself generate pointing somewhere non-local).
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { MockZarinpalGateway } from "./support/mock-zarinpal";
import { writeRuntimeState, STATE_PATH } from "./support/state";

// Anchored at process.cwd() rather than __dirname/import.meta.url: this
// file is loaded ambiguously as ESM or CJS depending on how it's invoked
// (directly under Playwright vs. the diagnostic script used while building
// this harness), and only one of those module-scope identifiers exists in
// each. `npm run test:e2e` (the one supported entrypoint — see e2e's
// README) always runs from the repo root, so cwd is reliable here.
const E2E_DIR = path.join(process.cwd(), "e2e");
const REPO_ROOT = process.cwd();
const API_DIR = path.join(REPO_ROOT, "apps", "api");
const STOREFRONT_DIR = path.join(REPO_ROOT, "apps", "storefront");

let pg: EmbeddedPostgres | undefined;
let pgDataDir = "";
let gateway: MockZarinpalGateway | undefined;
let apiProcess: ChildProcess | undefined;
let storefrontProcess: ChildProcess | undefined;

function failClosedPreflightCheck() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to start the E2E harness: NODE_ENV=production is set in the ambient environment.",
    );
  }
  if (process.env.ZARINPAL_MERCHANT_ID?.trim()) {
    throw new Error(
      "Refusing to start the E2E harness: a real ZARINPAL_MERCHANT_ID is set in the ambient " +
        "environment. The E2E harness only ever talks to a local mock gateway — a real merchant " +
        "id here means something upstream is misconfigured for production use.",
    );
  }
  if (process.env.DATABASE_URL) {
    throw new Error(
      "Refusing to start the E2E harness: DATABASE_URL is already set in the ambient " +
        "environment. This harness generates and owns its own disposable database URL; an " +
        "inherited one could point anywhere, including a shared/staging/production database.",
    );
  }
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitForHttp(url: string, timeoutMs: number, label: string) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
      lastError = new Error(`${label} responded ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${label} did not become ready at ${url}: ${lastError}`);
}

function spawnLogged(
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv; label: string },
): ChildProcess {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk) =>
    process.stdout.write(`[${options.label}] ${chunk}`),
  );
  child.stderr?.on("data", (chunk) =>
    process.stderr.write(`[${options.label}] ${chunk}`),
  );
  return child;
}

export default async function globalSetup() {
  failClosedPreflightCheck();

  mkdirSync(path.join(E2E_DIR, ".runtime"), { recursive: true });

  // 1. Disposable embedded Postgres.
  pgDataDir = mkdtempSync(path.join(tmpdir(), "rad-e2e-pg-"));
  const pgPort = await freePort();
  pg = new EmbeddedPostgres({
    databaseDir: pgDataDir,
    user: "rad",
    password: "rad",
    port: pgPort,
    persistent: false,
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("rad_e2e");
  const databaseUrl = `postgresql://rad:rad@127.0.0.1:${pgPort}/rad_e2e`;

  // 2. Seed the deterministic 1/1 test products (fixture.ts), as their own
  //    process (fails closed on its own via assertSafeScriptTarget — see
  //    support/seed-e2e-db.ts) — kept out of this long-lived process so its
  //    TypeORM entity imports never have to race this file's own module
  //    graph for when `reflect-metadata` gets polyfilled.
  await new Promise<void>((resolve, reject) => {
    const seed = spawn(
      "npx",
      [
        "tsx",
        // tsx resolves ONE tsconfig per process rather than walking up from
        // each imported file, and the root tsconfig.json both lacks
        // experimentalDecorators and explicitly excludes apps/* — so without
        // this flag, every TypeORM entity decorator this script transitively
        // imports (via seed-e2e-db.ts -> apps/api/seed/artwork-rows.ts)
        // silently compiles to the wrong decorator semantics and throws at
        // import time.
        "--tsconfig",
        path.join(API_DIR, "tsconfig.json"),
        path.join(E2E_DIR, "support", "seed-e2e-db-cli.ts"),
        databaseUrl,
      ],
      { stdio: "inherit" },
    );
    seed.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`seed-e2e-db-cli exited ${code}`)),
    );
  });

  // 3. Local mock ZarinPal gateway.
  gateway = new MockZarinpalGateway();
  await gateway.start();

  // 4. The real API, pointed at the disposable DB and the mock gateway.
  //    The storefront's port is allocated here (before either process
  //    starts) so the API's STOREFRONT_ORIGIN — ZarinPal's callback_url —
  //    points at THIS run's storefront, not the orders.service.ts fallback
  //    of http://localhost:3000, which nothing is listening on here.
  const apiPort = await freePort();
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const storefrontPort = await freePort();
  const storefrontUrl = `http://127.0.0.1:${storefrontPort}`;
  await new Promise<void>((resolve, reject) => {
    const build = spawn("npm", ["run", "build"], {
      cwd: API_DIR,
      stdio: "inherit",
    });
    build.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`api build exited ${code}`)),
    );
  });
  apiProcess = spawnLogged("node", ["dist/main.js"], {
    cwd: API_DIR,
    label: "api",
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT: String(apiPort),
      HOST: "127.0.0.1",
      DATABASE_URL: databaseUrl,
      TYPEORM_SYNCHRONIZE: "false",
      PAYMENT_MODE: "gateway",
      ZARINPAL_SANDBOX: "true",
      ZARINPAL_BASE_URL: gateway.baseUrl,
      STOREFRONT_ORIGIN: storefrontUrl,
      RAD_ALLOW_REMOTE_DB_WRITE: "",
    },
  });
  await waitForHttp(`${apiUrl}/health`, 60_000, "API");

  // 5. The real storefront, pointed at that API.
  storefrontProcess = spawnLogged(
    "npx",
    ["next", "dev", "-H", "127.0.0.1", "-p", String(storefrontPort)],
    {
      cwd: STOREFRONT_DIR,
      label: "storefront",
      env: {
        ...process.env,
        NODE_ENV: "development",
        API_URL: apiUrl,
      },
    },
  );
  await waitForHttp(storefrontUrl, 120_000, "storefront");

  writeRuntimeState({
    apiUrl,
    storefrontUrl,
    gatewayUrl: gateway.baseUrl,
    databaseUrl,
    pids: { api: apiProcess.pid ?? 0, storefront: storefrontProcess.pid ?? 0 },
    pgDataDir,
  });

  console.log(`[e2e] runtime state written to ${STATE_PATH}`);

  // Playwright calls this teardown function (the setup function's return
  // value) once after every test has finished, in this SAME process — so
  // it closes over the exact pg/gateway/process handles started above.
  return async function globalTeardown() {
    storefrontProcess?.kill("SIGTERM");
    apiProcess?.kill("SIGTERM");
    await gateway?.stop();
    try {
      await pg?.stop();
    } catch {
      // best-effort
    }
    if (pgDataDir) rmSync(pgDataDir, { recursive: true, force: true });
  };
}
