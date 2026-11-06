/**
 * Standalone entrypoint for `seedE2eDatabase`, run as its own child process
 * (see `global-setup.ts`) rather than imported in-process. The TypeORM
 * entity classes this pulls in transitively rely on `Reflect.getMetadata`
 * existing at decoration time; running this as a fresh process with its own
 * clean module graph (polyfill imported first, nothing else) is simpler and
 * more robust than trying to guarantee import-evaluation order across a
 * mixed ESM/CJS graph inside the long-lived Playwright process.
 */
import "reflect-metadata";
import { seedE2eDatabase } from "./seed-e2e-db";

async function main() {
  const databaseUrl = process.argv[2];
  if (!databaseUrl) {
    throw new Error("Usage: seed-e2e-db-cli.ts <databaseUrl>");
  }
  const { dataSource } = await seedE2eDatabase(databaseUrl);
  await dataSource.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
