import { MigrationInterface, QueryRunner } from "typeorm";
import { newDbId } from "../ids";
import { KNOWN_CATEGORY_SEEDS } from "../../categories/const/category-seeds";

/**
 * Adds the category tree and a nullable `Product.subcategoryId`.
 *
 * `up` inserts parent rows only: one for each known store slug, plus one
 * for every distinct `Product.category` value that is not already in that
 * list. It does not insert children, and it does not UPDATE product rows.
 * Existing `category`, slug, RAD number, and identity rows stay as they are.
 * `subcategoryId` is added null.
 *
 * `down` drops only the new column, table, and trigger function. It does
 * not rewrite or delete `Product` or `RadIdentity` rows.
 *
 * Run with `npm run migration:run` against an isolated database. The CLI
 * data source refuses a remote target unless the operator names it
 * explicitly. Do not run this against production from the pull request.
 */
export class AddCategories1794500000000 implements MigrationInterface {
  name = "AddCategories1794500000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "Category" (
        "id" text NOT NULL,
        "slug" text NOT NULL,
        "parentId" text,
        "name" jsonb NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_Category" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Category_slug" UNIQUE ("slug"),
        CONSTRAINT "CHK_Category_not_self_parent" CHECK ("parentId" IS NULL OR "parentId" <> "id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_Category_parentId" ON "Category" ("parentId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "Category"
      ADD CONSTRAINT "FK_Category_parentId"
      FOREIGN KEY ("parentId") REFERENCES "Category"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      CREATE FUNCTION category_parent_is_root() RETURNS trigger AS $body$
      BEGIN
        IF NEW."parentId" IS NOT NULL THEN
          IF NOT EXISTS (
            SELECT 1 FROM "Category" parent
            WHERE parent.id = NEW."parentId" AND parent."parentId" IS NULL
          ) THEN
            RAISE EXCEPTION 'category_parent_not_root' USING ERRCODE = '23514';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $body$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER category_parent_is_root
      BEFORE INSERT OR UPDATE ON "Category"
      FOR EACH ROW EXECUTE FUNCTION category_parent_is_root()
    `);
    await this.seedParents(queryRunner);
    await queryRunner.query(`ALTER TABLE "Product" ADD "subcategoryId" text`);
    await queryRunner.query(
      `CREATE INDEX "IDX_Product_subcategoryId" ON "Product" ("subcategoryId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "Product"
      ADD CONSTRAINT "FK_Product_subcategoryId"
      FOREIGN KEY ("subcategoryId") REFERENCES "Category"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Product" DROP CONSTRAINT "FK_Product_subcategoryId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_Product_subcategoryId"`);
    await queryRunner.query(
      `ALTER TABLE "Product" DROP COLUMN "subcategoryId"`,
    );
    await queryRunner.query(
      `DROP TRIGGER category_parent_is_root ON "Category"`,
    );
    await queryRunner.query(`DROP TABLE "Category"`);
    await queryRunner.query(`DROP FUNCTION category_parent_is_root()`);
  }

  private async seedParents(queryRunner: QueryRunner) {
    for (const seed of KNOWN_CATEGORY_SEEDS) {
      await queryRunner.query(
        `INSERT INTO "Category" ("id", "slug", "parentId", "name", "active", "sortOrder")
         VALUES ($1, $2, NULL, $3::jsonb, true, $4)
         ON CONFLICT ("slug") DO NOTHING`,
        [newDbId(), seed.slug, JSON.stringify(seed.name), seed.sortOrder],
      );
    }
    const stored: Array<{ category: string }> = await queryRunner.query(
      `SELECT DISTINCT category FROM "Product"
       WHERE category IS NOT NULL AND btrim(category) <> ''`,
    );
    const known = new Set(KNOWN_CATEGORY_SEEDS.map((seed) => seed.slug));
    const extras = stored
      .map((row) => row.category)
      .filter((category) => !known.has(category))
      .sort((a, b) => a.localeCompare(b));
    let sortOrder = KNOWN_CATEGORY_SEEDS.length;
    for (const slug of extras) {
      await queryRunner.query(
        `INSERT INTO "Category" ("id", "slug", "parentId", "name", "active", "sortOrder")
         VALUES ($1, $2, NULL, $3::jsonb, true, $4)
         ON CONFLICT ("slug") DO NOTHING`,
        [newDbId(), slug, JSON.stringify({ fa: slug, en: slug }), sortOrder],
      );
      sortOrder += 1;
    }
  }
}
