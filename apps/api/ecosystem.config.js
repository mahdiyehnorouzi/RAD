/**
 * Authoritative PM2 process definition for the API.
 *
 * `pm2 restart api` only re-executes whatever command PM2 already has
 * cached for the process — it cannot change that command. That's how
 * production ended up stuck running `npm run dev:api` (-> `nest start
 * --watch`, `synchronize` left on by default outside NODE_ENV=production)
 * long after every `pm2 restart --update-env` deploy: restart never had a
 * chance to fix it. Starting from this file instead (`pm2 start
 * ecosystem.config.js --only api`, after `pm2 delete api`) makes the
 * script/args/env the deploy always asks for, instead of whatever a past
 * manual `pm2 start` happened to use.
 *
 * `scripts/start-production.mjs` is kept as the entry point (not
 * `dist/main.js` directly): it runs the schema-sync-if-enabled and
 * ensure-staff steps that production boot requires every time, then
 * forwards PM2's signal to the real `dist/main.js` child and waits for it
 * to exit — see that file for why a plain `dist/main.js` entry can't do
 * that signal forwarding on its own.
 */
module.exports = {
  apps: [
    {
      name: "api",
      script: "scripts/start-production.mjs",
      cwd: __dirname,
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      watch: false,
      autorestart: true,
      // Must exceed start-production.mjs's own FORCE_KILL_GRACE_MS (10s)
      // plus headroom for Nest's enableShutdownHooks() teardown (closing
      // the TypeORM pool, clearing InventoryService's sweep timer) to run
      // to completion before PM2 escalates to SIGKILL itself. If PM2's
      // SIGKILL lands first, the child is torn down mid-shutdown exactly
      // like the un-forwarded-signal bug this is meant to fix.
      kill_timeout: 15_000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
