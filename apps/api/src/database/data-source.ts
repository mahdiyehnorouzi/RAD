import { DataSource, type DataSourceOptions } from "typeorm";
import { entities } from "./entities";

/** The Compose database used by local API development when no env file is present. */
export const DEFAULT_DATABASE_URL = "postgresql://rad:rad@localhost:5432/rad";

/** Strip Prisma-style `schema=` query params that `pg` does not understand. */
export function cleanDatabaseUrl(
  url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("schema");
    return parsed.toString();
  } catch {
    return url.replace(/[?&]schema=[^&]*/g, "").replace(/\?$/, "");
  }
}

/**
 * Schema sync can alter or drop production columns, so it is opt-in there:
 * an explicit `TYPEORM_SYNCHRONIZE` wins, otherwise it runs only outside production.
 */
export function schemaSyncEnabled(
  value = process.env.TYPEORM_SYNCHRONIZE,
  nodeEnv = process.env.NODE_ENV,
) {
  if (value) return value !== "false";
  return nodeEnv !== "production";
}

/**
 * `max` bounds how many connections THIS process can open; Liara's Postgres
 * caps the whole server at 100. `idleTimeoutMillis` only reaps clients sitting
 * idle *in the pool* — it does nothing for a connection stuck mid-transaction
 * on the Postgres side (state `idle in transaction`), which is why that's a
 * separate, pg-driver-level setting below: both are sent as session
 * parameters on each new connection (`SET ...` on connect), not a
 * database-wide `ALTER DATABASE`.
 */
export const POOL_EXTRA = {
  max: 5,
  keepAlive: true,
  keepAliveInitialDelayMillis: 1000,
  connectionTimeoutMillis: 20_000,
  idleTimeoutMillis: 10_000,
  // A stuck/abandoned transaction (e.g. the app process was killed between
  // running a query and committing) self-terminates instead of holding a
  // pool slot — and one of the server's 100 connections — forever.
  idle_in_transaction_session_timeout: 30_000,
  statement_timeout: 30_000,
};

export function typeOrmOptions(
  overrides: Partial<DataSourceOptions> = {},
): DataSourceOptions {
  return {
    type: "postgres",
    url: cleanDatabaseUrl(),
    entities: [...entities],
    synchronize: schemaSyncEnabled(),
    logging: false,
    extra: { ...POOL_EXTRA },
    ...overrides,
  } as DataSourceOptions;
}

export function createAppDataSource(
  overrides: Partial<DataSourceOptions> = {},
) {
  return new DataSource(typeOrmOptions(overrides));
}
