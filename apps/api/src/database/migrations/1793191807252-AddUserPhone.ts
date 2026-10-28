import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 2 (SMS OTP sign-in), PR 2: adds `User.phone` (nullable, unique) and
 * drops the NOT NULL on `User.email` so a phone-only account can exist
 * without one. `User.passwordHash` is deliberately untouched here — a
 * phone-only account gets an unusable random hash instead of a nullable
 * column (see `AuthService.signInWithPhone`), so this migration doesn't
 * race PR #96's own nullable-`passwordHash` migration (Google sign-in) by
 * altering the same column from two unmerged branches.
 *
 * Generated via `migration:generate` by diffing against a scratch Postgres
 * synced to every other entity's current schema (same process documented
 * on `AddPaymentIntentGatewayColumns1793032301266`), then hand-reviewed.
 * `down()` can only succeed if no phone-only account's row has a NULL
 * email by the time it runs — same caveat as any NOT NULL re-add; per this
 * repo's migration philosophy, the real rollback path once such rows exist
 * is restoring the pre-migration backup, not `migration:revert`.
 */
export class AddUserPhone1793191807252 implements MigrationInterface {
  name = "AddUserPhone1793191807252";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "User" ADD "phone" text`);
    await queryRunner.query(
      `ALTER TABLE "User" ADD CONSTRAINT "UQ_1f5c894f79cd0159ff4e1a44508" UNIQUE ("phone")`,
    );
    await queryRunner.query(
      `ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "User" DROP CONSTRAINT "UQ_1f5c894f79cd0159ff4e1a44508"`,
    );
    await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "phone"`);
  }
}
