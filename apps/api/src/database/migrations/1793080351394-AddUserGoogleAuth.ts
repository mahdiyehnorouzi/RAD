import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds what Google Sign-In needs on `User`: a nullable, unique `googleId`
 * (Google's stable per-account subject id) and a nullable `passwordHash`
 * (a Google-only account never gets one). Purely additive/loosening — no
 * existing row's `passwordHash` changes, so every current account keeps
 * signing in with email/password exactly as before.
 *
 * `migration:generate` also picked up a pre-existing, unrelated drift
 * (`IDX_ContactMessage_parentId`) already present in the diffed database —
 * deliberately left out here; it belongs in its own migration, not this one.
 */
export class AddUserGoogleAuth1793080351394 implements MigrationInterface {
  name = "AddUserGoogleAuth1793080351394";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "User" ADD "googleId" text`);
    await queryRunner.query(
      `ALTER TABLE "User" ADD CONSTRAINT "UQ_02dec29f4ca814ab6efa2d4f0c4" UNIQUE ("googleId")`,
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
      `ALTER TABLE "User" DROP CONSTRAINT "UQ_02dec29f4ca814ab6efa2d4f0c4"`,
    );
    await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "googleId"`);
  }
}
