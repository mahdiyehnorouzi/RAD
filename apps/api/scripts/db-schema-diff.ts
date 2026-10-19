/**
 * Read-only schema comparison: current TypeORM entities vs. whatever
 * database `DATABASE_URL` actually points at. Prints the exact queries
 * TypeORM's own schema builder computes it would need to run to reconcile
 * the two — NEVER executes them. `SchemaBuilder.log()` only builds query
 * objects in memory; nothing in this file ever calls `.query()`,
 * `.synchronize()`, or opens a write transaction.
 *
 * This is the SAME mechanism used to derive
 * `scripts/db-migrate-seaweedfs-catchup.ts`'s fixed, reviewed SQL in the
 * first place (see that file's header) — running it again here, live,
 * is what makes this a genuine verification tool rather than a restatement
 * of what we already believe: if production (or any other target) has
 * drifted in some way nobody anticipated, THIS is what catches it, not a
 * hand-maintained list.
 *
 * Usage:
 *   npx tsx scripts/db-schema-diff.ts
 *   (reads DATABASE_URL from the environment, same as the app itself)
 *
 * Exit code 0 = schema already matches every current entity exactly.
 * Exit code 1 = a diff exists (printed in full); exit code 2 = couldn't
 * even connect/introspect.
 */
import { createAppDataSource } from "../src/database/data-source";
import { parseDatabaseHost } from "../src/database/safe-target";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "ERROR: DATABASE_URL is not set. Refusing to guess a target.",
    );
    process.exit(2);
  }
  const host = parseDatabaseHost(url!);
  console.log(
    `Comparing current entities against database host: ${host || "(unparseable)"}`,
  );

  const ds = createAppDataSource({
    url,
    synchronize: false,
    logging: false,
  } as never);
  try {
    await ds.initialize();
  } catch (error) {
    console.error("ERROR: could not connect/introspect:", error);
    process.exit(2);
  }

  try {
    // Read-only: computes the diff, executes nothing.
    const sqlInMemory = await ds.driver.createSchemaBuilder().log();
    const up = sqlInMemory.upQueries;
    if (up.length === 0) {
      console.log("No diff. Schema matches every current entity exactly.");
      process.exit(0);
    }
    console.log(
      `\n${up.length} statement(s) TypeORM's synchronize would run to reconcile the schema (NOT executed by this script):\n`,
    );
    for (const q of up) console.log(`  ${q.query};`);
    console.log(
      "\nIf every one of these is already covered by " +
        "scripts/db-migrate-seaweedfs-catchup.ts, re-run that migration " +
        "(it is idempotent) and then this diff again - it should go to " +
        "zero. If something ELSE appears here, STOP: that is drift this " +
        "task did not anticipate, and needs its own reviewed migration, " +
        "not an assumption.",
    );
    process.exit(1);
  } finally {
    await ds.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
