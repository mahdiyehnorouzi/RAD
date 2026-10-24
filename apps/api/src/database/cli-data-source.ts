import { DataSource } from "typeorm";
import { entities } from "./entities";
import { cleanDatabaseUrl, POOL_EXTRA } from "./data-source";

/**
 * TypeORM-CLI-usable `DataSource` (a concrete instance, not the app's
 * factory) for `migration:run`/`migration:revert`/`migration:generate` —
 * see `apps/api/package.json`'s `migration:*` scripts. `synchronize` is
 * always `false` here: migrations are the explicit, reviewed alternative to
 * schema sync, never run alongside it.
 */
export default new DataSource({
  type: "postgres",
  url: cleanDatabaseUrl(),
  entities: [...entities],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false,
  logging: false,
  extra: { ...POOL_EXTRA },
});
