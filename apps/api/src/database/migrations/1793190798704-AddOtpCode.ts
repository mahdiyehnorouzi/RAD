import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the `OtpCode` table backing SMS OTP sign-in (Phase 2, split into its
 * own PR ahead of the `User.phone`/Google-OAuth linking work in #96): a
 * single-use, expiring, hashed code per phone number, mirroring
 * `PasswordResetToken`'s shape. Purely additive — no existing table,
 * column, or row is touched; `User` is untouched by this migration.
 *
 * Generated via `migration:generate` by diffing against a scratch Postgres
 * synced to every other entity's current schema (same process documented
 * on `AddPaymentIntentGatewayColumns1793032301266`), then hand-reviewed.
 * Needs the same production migration-approval step as every other
 * migration in this repo (`docs/db-migration-runbook.md`) — not applied
 * here.
 */
export class AddOtpCode1793190798704 implements MigrationInterface {
  name = "AddOtpCode1793190798704";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "OtpCode" ("id" text NOT NULL, "phone" text NOT NULL, "codeHash" text NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "consumedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4e5d67b726f57f2c3bf6f62acf9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aa9ff5030d250327c9b7d52611" ON "OtpCode" ("phone") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aa9ff5030d250327c9b7d52611"`,
    );
    await queryRunner.query(`DROP TABLE "OtpCode"`);
  }
}
