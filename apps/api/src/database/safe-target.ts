import { DEFAULT_DATABASE_URL } from "./data-source";

/**
 * Thrown by `assertSafeScriptTarget` when a script that writes/seeds/wipes
 * data would run against something that isn't a recognized local database.
 */
export class UnsafeDatabaseTargetError extends Error {}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** Never logs or returns the password/user portion of the URL. */
export function parseDatabaseHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function isLocalDatabaseUrl(url: string): boolean {
  const host = parseDatabaseHost(url);
  return host !== "" && LOCAL_HOSTS.has(host);
}

/**
 * Fail-closed guard for any script that mutates data outside the normal
 * request/response cycle (seed scripts, one-off backfills, destructive
 * cleanup scripts). Deliberately does NOT key off `NODE_ENV` — a developer
 * running a seed script locally rarely sets `NODE_ENV=production`, so that
 * alone proves nothing about which database `DATABASE_URL` actually points
 * at (this is exactly how a seed script could silently run against a
 * remote/shared/production database).
 *
 * Refuses anything that isn't `localhost`/`127.0.0.1`/`::1`, unless the
 * caller explicitly opts in with `RAD_ALLOW_REMOTE_DB_WRITE` set to the
 * *exact hostname* being connected to — naming the host (not just "yes")
 * means a copied/exported env var can't silently authorize a different,
 * unintended target later.
 */
export function assertSafeScriptTarget(
  context: string,
  url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
) {
  if (isLocalDatabaseUrl(url)) return;
  const host = parseDatabaseHost(url) || "(unparseable host)";
  const allow = process.env.RAD_ALLOW_REMOTE_DB_WRITE;
  if (allow && allow === host) return;
  throw new UnsafeDatabaseTargetError(
    `Refusing to run "${context}" against a non-local database (host: ${host}). ` +
      "This looks like it could be a shared/staging/production database, and this " +
      "script writes/seeds/mutates data. " +
      `If you really intend to run it against "${host}", re-run with ` +
      `RAD_ALLOW_REMOTE_DB_WRITE=${host} set explicitly for this one invocation.`,
  );
}
