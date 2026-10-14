import type { Logger } from "@nestjs/common";
import type { DataSource } from "typeorm";

/**
 * Additive migration adding reply-threading to `ContactMessage`: `parentId`
 * (null for a thread's first message, otherwise that message's own id) and
 * `fromAdmin` (true for a staff reply). Follows the same pattern as
 * `product-image-storage.migration.ts` — a plain function run from
 * `OnModuleInit`, safe to retry on every boot via `ADD COLUMN IF NOT EXISTS`.
 * No backfill needed: every existing row is a root message with no reply
 * (`parentId` stays NULL, `fromAdmin` defaults to false), which is exactly
 * what "no thread yet" should look like.
 */
export async function migrateContactMessageThreads(
  dataSource: DataSource,
  logger: Logger,
) {
  await dataSource.query(
    `ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "parentId" text`,
  );
  await dataSource.query(
    `ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "fromAdmin" boolean NOT NULL DEFAULT false`,
  );
  await dataSource.query(
    `CREATE INDEX IF NOT EXISTS "IDX_ContactMessage_parentId" ON "ContactMessage" ("parentId")`,
  );
  logger.log("ContactMessage thread columns ensured.");
}
