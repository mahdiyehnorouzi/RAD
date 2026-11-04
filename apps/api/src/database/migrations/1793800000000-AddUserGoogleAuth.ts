import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds what Google Sign-In needs on `User`: a nullable, unique `googleId`
 * (Google's stable per-account subject id) and a nullable `passwordHash`
 * (a Google-only account never gets one — unlike SMS OTP accounts, which
 * still get an unusable random hash; see `AuthService.signInWithPhone`).
 * Purely additive/loosening — no existing row's `passwordHash` changes, so
 * every current account keeps signing in with email/password exactly as
 * before.
 *
 * This is the migration `AddUserVerifiedPhone1793700000000`'s docstring
 * calls out as deliberately deferred, to avoid two unmerged branches
 * racing to alter the same column.
 *
 * `down()` can only succeed if no Google-only account's row has a NULL
 * `passwordHash` by the time it runs — per this repo's migration
 * philosophy, the real rollback path once such rows exist is restoring
 * the pre-migration backup, not `migration:revert`.
 */
export class AddUserGoogleAuth1793800000000 implements MigrationInterface {
  name = "AddUserGoogleAuth1793800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "User" ADD "googleId" text`);
    await queryRunner.query(
      `ALTER TABLE "User" ADD CONSTRAINT "UQ_User_googleId" UNIQUE ("googleId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "User" DROP CONSTRAINT "UQ_User_googleId"`,
    );
    await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "googleId"`);
  }
}
