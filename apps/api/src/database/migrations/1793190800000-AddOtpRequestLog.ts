import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the `OtpRequestLog` table backing `OtpService`'s phone-keyed OTP
 * send rate limit (see `OtpService.requestCode`): an insert-only, never-
 * deleted log of OTP send attempts per phone, counted over a trailing
 * window. Purely additive — no existing table, column, or row is touched;
 * `User` and `OtpCode` are untouched by this migration.
 *
 * Generated via `migration:generate` by diffing against a scratch Postgres
 * synced to every other entity's current schema (same process documented
 * on `AddOtpCode1793190798704`), then hand-reviewed and manually re-timed
 * to sit immediately after `AddOtpCode1793190798704` in the same PR. Needs
 * the same production migration-approval step as every other migration in
 * this repo — not applied here.
 */
export class AddOtpRequestLog1793190800000 implements MigrationInterface {
  name = "AddOtpRequestLog1793190800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "OtpRequestLog" ("id" text NOT NULL, "phone" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_51ec8fa581ef2570347a89fbf73" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5625cefd2c76b54b56a42d4ec4" ON "OtpRequestLog" ("phone") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5625cefd2c76b54b56a42d4ec4"`,
    );
    await queryRunner.query(`DROP TABLE "OtpRequestLog"`);
  }
}
