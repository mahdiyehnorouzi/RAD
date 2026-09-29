import { createAppDataSource, schemaSyncEnabled } from "../src/database/data-source";

/** `--if-enabled` (production boot) skips unless `schemaSyncEnabled()`; without it the sync is forced. */
const onlyIfEnabled = process.argv.includes("--if-enabled");

async function main() {
  if (onlyIfEnabled && !schemaSyncEnabled()) {
    console.log("Schema sync skipped (set TYPEORM_SYNCHRONIZE=true to enable).");
    return;
  }
  const dataSource = createAppDataSource({ synchronize: true });
  await dataSource.initialize();
  await dataSource.query("SELECT 1");
  await dataSource.destroy();
  console.log("Database schema synchronized.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
