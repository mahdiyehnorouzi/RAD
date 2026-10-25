import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the four dynamic-product-attributes tables
 * (ProductAttribute/Option/Category/Value) — purely additive: no existing
 * table, column, or row is touched. Generated via `typeorm migration:generate`
 * by diffing the entities against a database that already had every other
 * table, then hand-reviewed. Run explicitly with `npm run migration:run`
 * (see `apps/api/src/database/cli-data-source.ts` and
 * `docs/db-migration-runbook-product-attributes.md`) rather than relying
 * on `TYPEORM_SYNCHRONIZE` in production — the real VPS release path
 * (`scripts/production/rad_release.py`) already refuses to release with
 * `TYPEORM_SYNCHRONIZE=true` set, so this is the only way these tables
 * get created there.
 *
 * `down` unconditionally DROPs all four tables — safe only for undoing
 * this migration before it has ever shipped to a database admins use (a
 * local/dev/CI database, or a production run you are reverting within the
 * same change window, before any attribute has been created). Once an
 * admin may have created a real attribute or a product may have a real
 * saved value, `migration:revert` must NEVER be run against that database
 * — per this repo's established migration philosophy (see
 * `docs/db-migration-runbook.md`), the only safe "undo" for an additive
 * migration that real data may already depend on is restoring from a
 * point-in-time backup taken before `up()` ran, never an automated DROP.
 * Old application code is unaffected either way: it never references
 * these tables, so leaving them in place (populated or not) after a
 * code-only rollback is always safe and requires no action.
 */
export class AddProductAttributes1792865771843 implements MigrationInterface {
  name = "AddProductAttributes1792865771843";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ProductAttributeCategory" ("id" text NOT NULL, "attributeId" text NOT NULL, "category" text NOT NULL, CONSTRAINT "ProductAttributeCategory_attributeId_category_key" UNIQUE ("attributeId", "category"), CONSTRAINT "PK_5239f1818cd24f40e568c9203cc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_312b0eb9c9f1b7c484bd8219cb" ON "ProductAttributeCategory"  ("attributeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0c8f99de170884da5a7053c56b" ON "ProductAttributeCategory"  ("category") `,
    );
    await queryRunner.query(
      `CREATE TABLE "ProductAttributeOption" ("id" text NOT NULL, "attributeId" text NOT NULL, "value" text NOT NULL, "label" text NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_04648ea01e76809af8e52864f58" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_216747c62d639d0ef350869335" ON "ProductAttributeOption"  ("attributeId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "ProductAttribute" ("id" text NOT NULL, "key" text NOT NULL, "label" text NOT NULL, "inputType" text NOT NULL, "unit" text, "required" boolean NOT NULL DEFAULT false, "active" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "ProductAttribute_key_key" UNIQUE ("key"), CONSTRAINT "PK_ddab9b99bd4b8960ec5bcf41410" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ProductAttributeValue" ("id" text NOT NULL, "productId" text NOT NULL, "attributeId" text NOT NULL, "value" jsonb NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "ProductAttributeValue_productId_attributeId_key" UNIQUE ("productId", "attributeId"), CONSTRAINT "PK_49052046c54c766c2623e856435" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_39ec877b0ba91188b4408d4d6c" ON "ProductAttributeValue"  ("productId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c1083c80d36e52e6c50fbfcdba" ON "ProductAttributeValue"  ("attributeId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ProductAttributeCategory" ADD CONSTRAINT "FK_312b0eb9c9f1b7c484bd8219cb0" FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ProductAttributeOption" ADD CONSTRAINT "FK_216747c62d639d0ef350869335c" FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "FK_39ec877b0ba91188b4408d4d6c5" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "FK_c1083c80d36e52e6c50fbfcdba1" FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ProductAttributeValue" DROP CONSTRAINT "FK_c1083c80d36e52e6c50fbfcdba1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ProductAttributeValue" DROP CONSTRAINT "FK_39ec877b0ba91188b4408d4d6c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ProductAttributeOption" DROP CONSTRAINT "FK_216747c62d639d0ef350869335c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ProductAttributeCategory" DROP CONSTRAINT "FK_312b0eb9c9f1b7c484bd8219cb0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c1083c80d36e52e6c50fbfcdba"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_39ec877b0ba91188b4408d4d6c"`,
    );
    await queryRunner.query(`DROP TABLE "ProductAttributeValue"`);
    await queryRunner.query(`DROP TABLE "ProductAttribute"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_216747c62d639d0ef350869335"`,
    );
    await queryRunner.query(`DROP TABLE "ProductAttributeOption"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0c8f99de170884da5a7053c56b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_312b0eb9c9f1b7c484bd8219cb"`,
    );
    await queryRunner.query(`DROP TABLE "ProductAttributeCategory"`);
  }
}
