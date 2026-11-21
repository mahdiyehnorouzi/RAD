import { MigrationInterface, QueryRunner } from "typeorm";
import {
  backfillLegacyIdentitiesSql,
  syncRadIdentitySequenceSql,
} from "../../identities/identity.sequence";

/**
 * Permanent RAD identity registry. Copies numbers that products already
 * have; it does not allocate new ones and it does not renumber anything.
 * Safe to run again: objects are created only if missing, and the backfill
 * inserts skip numbers that already have a row. The sequence is only ever
 * moved forward.
 */
export class AddRadIdentity1794000000000 implements MigrationInterface {
  name = "AddRadIdentity1794000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "RadIdentityBatch" (
        "id" text PRIMARY KEY,
        "idempotencyKey" text NOT NULL,
        "quantity" integer NOT NULL,
        "startNumber" integer NOT NULL,
        "endNumber" integer NOT NULL,
        "createdById" text,
        "printedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_RadIdentityBatch_key" UNIQUE ("idempotencyKey")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "RadIdentity" (
        "id" text PRIMARY KEY,
        "radNumber" integer NOT NULL,
        "productId" text,
        "status" text NOT NULL,
        "batchId" text,
        "reservedAt" timestamptz NOT NULL,
        "assignedAt" timestamptz,
        "printedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_RadIdentity_radNumber" UNIQUE ("radNumber"),
        CONSTRAINT "CHK_RadIdentity_status" CHECK (
          "status" IN ('reserved', 'assigned', 'retired')
        ),
        CONSTRAINT "CHK_RadIdentity_assignment" CHECK (
          ("status" = 'reserved' AND "productId" IS NULL)
          OR ("status" = 'assigned' AND "productId" IS NOT NULL)
          OR ("status" = 'retired')
        )
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_RadIdentity_productId"
      ON "RadIdentity" ("productId")
      WHERE "productId" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_RadIdentity_status"
      ON "RadIdentity" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_RadIdentity_batchId"
      ON "RadIdentity" ("batchId")
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "RadIdentityEvent" (
        "id" text PRIMARY KEY,
        "identityId" text NOT NULL,
        "kind" text NOT NULL,
        "productId" text,
        "batchId" text,
        "at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_RadIdentityEvent_identityId"
      ON "RadIdentityEvent" ("identityId")
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "RadIdentity"
          ADD CONSTRAINT "FK_RadIdentity_product"
          FOREIGN KEY ("productId") REFERENCES "Product"("id")
          ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(backfillLegacyIdentitiesSql());
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS rad_identity_number_seq AS integer
    `);
    await queryRunner.query(syncRadIdentitySequenceSql());
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "RadIdentity"
          ADD CONSTRAINT "CHK_RadIdentity_status" CHECK (
            "status" IN ('reserved', 'assigned', 'retired')
          );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "RadIdentity"
          ADD CONSTRAINT "CHK_RadIdentity_assignment" CHECK (
            ("status" = 'reserved' AND "productId" IS NULL)
            OR ("status" = 'assigned' AND "productId" IS NOT NULL)
            OR ("status" = 'retired')
          );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION rad_identity_retire_on_product_delete()
      RETURNS trigger AS $$
      BEGIN
        UPDATE "RadIdentity"
        SET "status" = 'retired',
            "productId" = NULL,
            "updatedAt" = now()
        WHERE "productId" = OLD."id";
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS rad_identity_retire_on_product_delete ON "Product"
    `);
    await queryRunner.query(`
      CREATE TRIGGER rad_identity_retire_on_product_delete
      BEFORE DELETE ON "Product"
      FOR EACH ROW
      EXECUTE FUNCTION rad_identity_retire_on_product_delete()
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION rad_identity_guard_product_number()
      RETURNS trigger AS $$
      BEGIN
        IF OLD."radNumber" IS NOT NULL
           AND NEW."radNumber" IS DISTINCT FROM OLD."radNumber" THEN
          RAISE EXCEPTION 'rad_number_immutable' USING ERRCODE = 'check_violation';
        END IF;
        IF OLD."radNumber" IS NULL AND NEW."radNumber" IS NOT NULL THEN
          IF NOT EXISTS (
            SELECT 1 FROM "RadIdentity" i
            WHERE i."radNumber" = NEW."radNumber"
              AND (
                (i."status" = 'reserved' AND i."productId" IS NULL)
                OR i."productId" = NEW."id"
              )
          ) THEN
            RAISE EXCEPTION 'rad_number_without_identity' USING ERRCODE = 'check_violation';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS rad_identity_guard_product_number ON "Product"
    `);
    await queryRunner.query(`
      CREATE TRIGGER rad_identity_guard_product_number
      BEFORE UPDATE OF "radNumber" ON "Product"
      FOR EACH ROW
      EXECUTE FUNCTION rad_identity_guard_product_number()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS rad_identity_guard_product_number ON "Product"
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS rad_identity_retire_on_product_delete ON "Product"
    `);
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS rad_identity_guard_product_number()
    `);
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS rad_identity_retire_on_product_delete()
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "RadIdentityEvent"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "RadIdentity"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "RadIdentityBatch"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS rad_identity_number_seq`);
  }
}
