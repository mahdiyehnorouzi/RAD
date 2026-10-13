import { Controller, Get } from "@nestjs/common";
import { DataSource } from "typeorm";
import { APP_VERSION } from "../version";

const DB_CHECK_TIMEOUT_MS = 2000;

/** Races a DB ping against a short timeout so a slow/unreachable DB can never make the health check itself hang. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

@Controller("health")
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Distinguishes "the API process is alive" from "its database is
   * reachable" so dev/monitoring can tell a 503 from the proxy apart from a
   * hung backend apart from a down DB, instead of guessing. Never returns
   * connection strings, hostnames, or raw driver errors — just booleans.
   */
  @Get()
  async check() {
    const db = await withTimeout(
      this.dataSource.query("SELECT 1").then(() => true),
      DB_CHECK_TIMEOUT_MS,
    ).catch(() => false);
    return {
      ok: db,
      service: "rad-api",
      version: process.env.RAD_VERSION ?? APP_VERSION,
      // Not a secret — just the mode name. Lets a deploy script confirm the
      // process it just started is actually running in production mode
      // (e.g. `synchronize` disabled) rather than a leftover `nest start
      // --watch` dev process that happens to report a matching version.
      env: process.env.NODE_ENV ?? "development",
      api: true,
      db,
    };
  }
}
