import EmbeddedPostgres from "embedded-postgres";
import { mkdirSync } from "node:fs";
import path from "node:path";

const databaseDir = path.resolve(process.cwd(), "data/pg");
mkdirSync(databaseDir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "rad",
  password: "rad",
  port: 5432,
  persistent: true,
});

await pg.initialise();
await pg.start();
try {
  await pg.createDatabase("rad");
} catch {
  // Database already exists from a previous run.
}
console.log("PostgreSQL is running at postgresql://rad:rad@localhost:5432/rad");
