import type { Logger } from "@nestjs/common";
import type { DataSource } from "typeorm";

/**
 * Phase 0 of the R2 image-storage migration (additive, backwards-compatible).
 *
 * `ProductImage.src` has always been overloaded with three different formats
 * (base64 data URI, a storefront-relative static path, or a full external
 * URL), inferred by string-prefix sniffing wherever it was read. This adds a
 * durable `storage` tag and a reserved `objectKey` column (for a future R2
 * integration — nothing writes it yet) and backfills `storage` for every
 * existing row from the current `src` value.
 *
 * Follows the same pattern as `order-status.migration.ts`: a plain function
 * run from `OnModuleInit`, retried harmlessly on the next boot if it fails,
 * rather than a TypeORM CLI migration — this repo does not use the TypeORM
 * migration runner (schema is handled by `synchronize` outside production;
 * see `data-source.ts`). The `ADD COLUMN IF NOT EXISTS` calls make this safe
 * to run even where `synchronize` already created the columns, and safe to
 * retry on every boot.
 */
export async function migrateProductImageStorage(
  dataSource: DataSource,
  logger: Logger,
) {
  await dataSource.query(
    `ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "storage" text`,
  );
  await dataSource.query(
    `ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "objectKey" text`,
  );
  // Added for the Cloudinary direct-upload path (Phase 2): optional cached
  // convenience only, never the source of truth for a delivery URL (see
  // `product-image.entity.ts`). Safe to add unconditionally — nothing
  // backfills it, same as `objectKey` before Phase 2 existed.
  await dataSource.query(
    `ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "secureUrl" text`,
  );

  // Nothing existing ever wrote `cloudinary` (same situation `r2` was in
  // before this migration's logic was last touched): no row needs
  // backfilling into it, so the CASE below intentionally has no branch
  // for it. Backfill is keyed on the real prefixes in use across the frontend
  // (`photo-works.ts`, `category-defaults.ts`): `/catalog/photos/...` and
  // `/catalog/defaults/...`, both covered by the `/catalog/` prefix check.
  //
  // Fallback for anything else (NULL src, or a value matching none of the
  // known shapes): `external`. `legacy_base64` is explicitly NOT a safe
  // default here — it would make `media.controller.ts` attempt to base64-decode
  // and stream bytes for a value that was never a data URI. `external`/`static`
  // both resolve to "return `src` as-is", which is the most neutral,
  // non-destructive behavior for a value we don't recognize (including NULL,
  // where the mapper already falls back to the `/catalog/images/:id`
  // placeholder when `src` is empty).
  const result = await dataSource.query(`
    UPDATE "ProductImage"
       SET "storage" = CASE
         WHEN src LIKE 'data:image/%' THEN 'legacy_base64'
         WHEN src LIKE '/catalog/%' THEN 'static'
         WHEN src LIKE 'http://%' OR src LIKE 'https://%' THEN 'external'
         ELSE 'external'
       END
     WHERE "storage" IS NULL
  `);
  const updated = Array.isArray(result) ? Number(result[1] ?? 0) : 0;
  if (updated) {
    logger.log(`Backfilled storage on ${updated} ProductImage row(s).`);
  }
}
