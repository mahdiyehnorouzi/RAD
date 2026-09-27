import { DataSource, type DataSourceOptions } from "typeorm";
import { entities } from "./entities";

/** Strip Prisma-style `schema=` query params that `pg` does not understand. */
export function cleanDatabaseUrl(url = process.env.DATABASE_URL ?? "") {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("schema");
    return parsed.toString();
  } catch {
    return url.replace(/[?&]schema=[^&]*/g, "").replace(/\?$/, "");
  }
}

export function typeOrmOptions(overrides: Partial<DataSourceOptions> = {}): DataSourceOptions {
  const synchronize = (process.env.TYPEORM_SYNCHRONIZE ?? "true") !== "false";
  return {
    type: "postgres",
    url: cleanDatabaseUrl(),
    entities: [...entities],
    synchronize,
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

export function createAppDataSource(overrides: Partial<DataSourceOptions> = {}) {
  return new DataSource(typeOrmOptions(overrides));
}
