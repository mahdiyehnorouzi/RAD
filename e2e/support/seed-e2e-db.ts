/**
 * Seeds the deterministic, unique (1/1) test products listed in
 * `fixture.ts` into the disposable E2E database, reusing the SAME seeding
 * code production uses (`seedArtists`/`seedArtworks`/`artworkRow` from
 * `apps/api/seed/`) rather than hand-building `Product` rows, so the shape
 * stays correct even if the entity changes later.
 *
 * Must only ever run against a loopback database — `assertSafeScriptTarget`
 * (the same fail-closed guard every other seed/migration script in the repo
 * uses) is called before anything is written.
 */
import { artworkRecords } from "@rad/artworks";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../../apps/api/src/database/data-source";
import { assertSafeScriptTarget } from "../../apps/api/src/database/safe-target";
import { seedArtists, seedArtworks } from "../../apps/api/seed/artwork-rows";
import { ALL_E2E_TEST_PRODUCT_SLUGS } from "./fixture";

export async function seedE2eDatabase(
  databaseUrl: string,
): Promise<{ dataSource: DataSource }> {
  assertSafeScriptTarget("e2e seed-e2e-db", databaseUrl);

  const records = ALL_E2E_TEST_PRODUCT_SLUGS.map((slug) => {
    const record = artworkRecords.find(
      (r) => r.slug === slug && r.initialStatus === "available",
    );
    if (!record) {
      throw new Error(
        `E2E fixture artwork "${slug}" is missing or no longer "available" in @rad/artworks — pick another available, priced record in fixture.ts.`,
      );
    }
    return record;
  });

  const dataSource = createAppDataSource({ url: databaseUrl, synchronize: true });
  await dataSource.initialize();
  await seedArtists(dataSource);
  await seedArtworks(dataSource, records, (record) => records.indexOf(record));

  return { dataSource };
}
