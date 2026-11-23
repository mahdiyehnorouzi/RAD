import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Data-only migration (no column change): before this, `AuthService
 * .signInWithPhone` wrote `User.verifiedPhone` only, never the
 * self-reported contact `User.phone` — so any account created or signed
 * into purely by phone OTP had an empty "شماره موبایل" on its profile
 * forever, even though the number was right there, proven, in
 * `verifiedPhone`. `signInWithPhone` now backfills `phone` itself for
 * future sign-ins; this migration does the same one-time backfill for
 * every row that already exists, so existing users do not have to sign
 * out and back in via OTP again to see their number.
 *
 * Only ever *fills a null*, and only when safe: `phone` keeps its unique
 * index, so a row is skipped if some other account already holds that
 * exact string in its own unverified `phone` column (the same collision
 * `AuthService.backfillContactPhone` guards against at sign-in time) —
 * this never overwrites an existing contact value and never merges two
 * accounts.
 *
 * `down()` is a best-effort inverse: it clears `phone` only where it
 * still equals `verifiedPhone`, which also clears a contact value a user
 * deliberately re-typed to match their verified number after this ran.
 * Per this repo's migration philosophy (see `AddUserVerifiedPhone`'s
 * docstring), the real rollback path is restoring the pre-migration
 * backup, not `migration:revert`.
 */
export class BackfillContactPhoneFromVerifiedPhone1794300000000 implements MigrationInterface {
  name = "BackfillContactPhoneFromVerifiedPhone1794300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "User" AS target
      SET "phone" = target."verifiedPhone"
      WHERE target."phone" IS NULL
        AND target."verifiedPhone" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "User" AS other
          WHERE other."phone" = target."verifiedPhone"
            AND other."id" <> target."id"
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "User"
      SET "phone" = NULL
      WHERE "phone" IS NOT NULL
        AND "phone" = "verifiedPhone"
    `);
  }
}
