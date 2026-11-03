import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 2 (SMS OTP sign-in), PR 2: adds `User.verifiedPhone` (nullable,
 * unique) and drops the NOT NULL on `User.email` so a phone-only account
 * can exist without one.
 *
 * `verifiedPhone` is deliberately a separate column from the pre-existing
 * `User.phone` (added by `AddUserContactPhone1793510000000` for the
 * self-reported, unverified contact mobile on the account profile).
 * `phone` is writable by the account owner with no proof of ownership
 * (`ProfileService.update`); `verifiedPhone` is written only after
 * `OtpService.verifyCode` succeeds for that exact number
 * (`AuthService.signInWithPhone`). Looking up or auto-linking sign-in by
 * the unverified `phone` column instead would let whoever later proves
 * ownership of a number a victim once typed into their own contact field
 * sign into that victim's account with no password — these two columns
 * must never be merged into one.
 *
 * `User.passwordHash` is deliberately untouched here — a phone-only
 * account gets an unusable random hash instead of a nullable column (see
 * `AuthService.signInWithPhone`), so this migration doesn't race PR #96's
 * own nullable-`passwordHash` migration (Google sign-in) by altering the
 * same column from two unmerged branches.
 *
 * Generated via `migration:generate` by diffing against a scratch Postgres
 * synced to every other entity's current schema (same process documented
 * on `AddPaymentIntentGatewayColumns1793032301266`), then hand-reviewed.
 * `down()` can only succeed if no phone-only account's row has a NULL
 * email by the time it runs — same caveat as any NOT NULL re-add; per this
 * repo's migration philosophy, the real rollback path once such rows exist
 * is restoring the pre-migration backup, not `migration:revert`.
 */
export class AddUserVerifiedPhone1793700000000 implements MigrationInterface {
  name = "AddUserVerifiedPhone1793700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "User" ADD "verifiedPhone" text`);
    await queryRunner.query(
      `ALTER TABLE "User" ADD CONSTRAINT "UQ_c3c7f3f6a2e42e9f6a9d2d9c6e1" UNIQUE ("verifiedPhone")`,
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
      `ALTER TABLE "User" DROP CONSTRAINT "UQ_c3c7f3f6a2e42e9f6a9d2d9c6e1"`,
    );
    await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "verifiedPhone"`);
  }
}
