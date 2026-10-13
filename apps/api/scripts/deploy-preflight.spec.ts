import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";

interface EcosystemApp {
  name: string;
  script: string;
  cwd: string;
  watch: boolean;
  kill_timeout: number;
  env: Record<string, string>;
}

const loadModule = createRequire(__filename);
const ecosystem: { apps: EcosystemApp[] } = loadModule(
  path.join(__dirname, "..", "ecosystem.config.js"),
);

const FORCE_KILL_GRACE_MS = 10_000;

test("pm2 ecosystem config points at the production wrapper, not nest/npm dev mode", () => {
  const api = ecosystem.apps.find((app) => app.name === "api");
  assert.ok(api, 'ecosystem.config.js must define an "api" app');
  assert.match(
    api!.script,
    /start-production\.mjs$/,
    "must run the production wrapper, never `npm run dev:api` / `nest start --watch`",
  );
  assert.doesNotMatch(api!.script, /npm|nest/);
});

test("watch mode is explicitly disabled", () => {
  const api = ecosystem.apps.find((app) => app.name === "api")!;
  assert.equal(
    api.watch,
    false,
    "PM2 file-watch must stay off in production — it is not what guards against stale dev mode, the explicit script path is",
  );
});

test("NODE_ENV=production is set, so TypeORM schema sync defaults off", () => {
  const api = ecosystem.apps.find((app) => app.name === "api")!;
  assert.equal(api.env.NODE_ENV, "production");
});

test("kill_timeout leaves room for start-production.mjs's own forced-kill grace period", () => {
  const api = ecosystem.apps.find((app) => app.name === "api")!;
  assert.ok(
    api.kill_timeout > FORCE_KILL_GRACE_MS,
    `pm2 kill_timeout (${api.kill_timeout}ms) must exceed the wrapper's ` +
      `FORCE_KILL_GRACE_MS (${FORCE_KILL_GRACE_MS}ms), or PM2 SIGKILLs the ` +
      "wrapper before it finishes waiting on the real child",
  );
});
