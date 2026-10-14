import { artworkRecords, registryProblems } from "@rad/artworks";
import { createAppDataSource } from "../src/database/data-source";
import { assertSafeScriptTarget } from "../src/database/safe-target";
import { backfillRadNumbers, seedArtists, seedArtworks } from "./artwork-rows";
import { ensureStaff } from "./ensure-staff";
import { seedCommerce } from "./seed-commerce";

async function main() {
  // This upserts known dev-only staff logins (public passwords, see
  // ensure-staff.ts) and demo/fake orders — never something to run against
  // a real database by accident.
  assertSafeScriptTarget("seed.ts");

  const problems = registryProblems();
  if (problems.length)
    throw new Error(
      `Artwork registry is inconsistent:\n${problems.join("\n")}`,
    );

  const dataSource = createAppDataSource();
  await dataSource.initialize();
  try {
    await ensureStaff(dataSource);
    await seedArtists(dataSource);
    await seedArtworks(dataSource, artworkRecords, (record) =>
      artworkRecords.indexOf(record),
    );
    await backfillRadNumbers(dataSource);
    // Demo orders carry fake customers and mark their works sold.
    if (process.env.NODE_ENV === "production") {
      console.log("Demo orders skipped in production.");
    } else {
      await seedCommerce(dataSource);
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
