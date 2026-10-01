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

export function typeOrmOptions(
  overrides: Partial<DataSourceOptions> = {},
): DataSourceOptions {
  return {
    type: "postgres",
    url: cleanDatabaseUrl(),
    entities: [...entities],
    synchronize: schemaSyncEnabled(),
    logging: false,
    extra: {
      max: 5,
      keepAlive: true,
      keepAliveInitialDelayMillis: 1000,
      connectionTimeoutMillis: 20_000,
      idleTimeoutMillis: 10_000,
    },
    ...overrides,
  } as DataSourceOptions;
}

export function createAppDataSource(
  overrides: Partial<DataSourceOptions> = {},
) {
  return new DataSource(typeOrmOptions(overrides));
}
