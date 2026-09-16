import { createAppDataSource } from "../src/database/data-source";

async function main() {
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
