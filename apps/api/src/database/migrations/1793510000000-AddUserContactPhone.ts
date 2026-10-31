import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds `User.phone` for the account contact mobile. Nullable: existing
 * accounts have no saved number. The unique index rejects two accounts
 * sharing one canonical `09#########` value and still allows many nulls.
 *
 * Email stays the sign-in and password-reset identifier; this column is
 * not an authentication secret and does not change order snapshots.
 *
 * `down` drops the column. Safe only before any saved contact number is
 * needed. Once customers rely on the value, restore a backup instead of
 * reverting.
 */
export class AddUserContactPhone1793510000000 implements MigrationInterface {
  name = "AddUserContactPhone1793510000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" text`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_User_phone" ON "User" ("phone")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_User_phone"`);
    await queryRunner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "phone"`);
  }
}
