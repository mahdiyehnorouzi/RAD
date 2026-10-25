import { DataSource } from "typeorm";
import { entities } from "./entities";
import { cleanDatabaseUrl, POOL_EXTRA } from "./data-source";
import { assertSafeScriptTarget } from "./safe-target";

/**
 * Unlike `createAppDataSource`/`typeOrmOptions` (the app's own boot path),
 * this NEVER falls back to `DEFAULT_DATABASE_URL` (the `rad:rad@localhost`
 * dev default) when `DATABASE_URL` is unset. A migration is a deliberate,
 * explicit, one-off operator action against a specific database — silently
 * running it against whatever Postgres happens to be reachable at
 * localhost:5432 (which may not even be the intended target, or may not
 * exist at all) is exactly the kind of mistake this guard exists to make
 * impossible. The operator must export `DATABASE_URL` themselves (see
 * `docs/db-migration-runbook-product-attributes.md`); there is no implicit
 * source for it here.
 *
 * On top of that, `assertSafeScriptTarget` — the same fail-closed guard
 * every other data-mutating script in this repo already uses (see
 * `apps/api/scripts/db-migrate-seaweedfs-catchup.ts`) — refuses anything
 * that isn't a local database unless `RAD_ALLOW_REMOTE_DB_WRITE` names the
 * *exact* target hostname, so a migration can never land on production (or
 * any other remote database) by a copied/exported env var alone.
 */
function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.trim()) {
    throw new Error(
      "DATABASE_URL must be set explicitly to run a migration — refusing to fall back to any default. " +
        "Export it from the target environment's own config (e.g. `set -a; source /etc/rad/api.env; set +a`" +
        " on the API host) before running migration:run/migration:revert/migration:generate.",
    );
  }
  assertSafeScriptTarget(
    "migration:run/migration:revert/migration:generate",
    url,
  );
  return url;
}

/**
 * TypeORM-CLI-usable `DataSource` (a concrete instance, not the app's
 * factory) for `migration:run`/`migration:revert`/`migration:generate` —
 * see `apps/api/package.json`'s `migration:*` scripts. `synchronize` is
 * always `false` here: migrations are the explicit, reviewed alternative to
 * schema sync, never run alongside it.
 */
export default new DataSource({
  type: "postgres",
  url: cleanDatabaseUrl(resolveDatabaseUrl()),
  entities: [...entities],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false,
  logging: false,
  extra: { ...POOL_EXTRA },
});
